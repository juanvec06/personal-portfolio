import {
  Component, inject, ElementRef, Renderer2, QueryList, ViewChildren, ViewChild,
  AfterViewInit, OnInit, OnDestroy, NgZone, PLATFORM_ID, Inject, signal, effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { DeviceService } from '../../../core/services/device.service';
import { ThemeService } from '../../../core/services/theme.service';

interface Project {
  title: string;
  description: string;
  Url: string;
  imageLocation: string;
}
interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

// La secuencia de imágenes (assets/white-tree para oscuro, assets/tree para claro)
// tiene 270 fotogramas y se reparte entre los proyectos: con 5 proyectos, cada uno
// ocupa 54 fotogramas de crecimiento del árbol.
const FRAME_COUNT = 270;
const PROJECT_COUNT = 5;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Servicio inyectado para detectar si el dispositivo es móvil. */
  protected deviceService = inject(DeviceService);
  /** Señal reactiva que indica si el dispositivo es móvil. */
  protected isMobile = this.deviceService.isMobile;
  private themeService = inject(ThemeService);
  /** Señal del tema actual ('light' | 'dark'). */
  protected theme = this.themeService.theme;

  /** Índice del proyecto/fase actualmente visible (0..PROJECT_COUNT-1). */
  protected activeIndex = signal(0);

  /** Referencia a las tarjetas de proyecto (para el efecto hover en móvil). */
  @ViewChildren('projectCard') projectCards!: QueryList<ElementRef>;
  @ViewChild('pinned') pinnedRef?: ElementRef<HTMLElement>;
  @ViewChild('sequenceCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  projects: Project[] = [
    {
      title: 'Appointments and administrative utilities Manager System',
      description: 'Developed as an academic project, this application manages appointments and administrative tasks for barbershops. Built with Angular and Spring Boot, it features user authentication, role-based access control, and a responsive design for optimal performance across devices.',
      Url: 'https://github.com/juanvec06/api-gateway-barbershop',
      imageLocation: 'assets/appointment-management-image.webp'
    },
    {
      title: 'Personal Portfolio',
      description: 'Personal Portfolio Website, i engineered a personal website using Angular and TypeScript to showcase technical expertise and project milestones.',
      Url: 'https://juandavidvelacoronado.vercel.app/',
      imageLocation: 'assets/portfolio-image.webp'
    },
    {
      title: 'Academic Project Management System',
      description: 'Developed as an academic project, this microservices-based platform is designed to streamline the management of academic projects by facilitating collaboration between students, companies, and coordinators. It was developed using Java with Spring Boot for the backend and Java Swing for the frontend.',
      Url: 'https://github.com/paulamunoz06/GestionProyectosMicro/tree/main',
      imageLocation: 'assets/project-management-image.webp'
    },
    // TODO: proyecto de ejemplo generado — reemplazar con datos e imagen reales.
    {
      title: 'Example Project — REST API Toolkit',
      description: 'Example placeholder project. A backend toolkit exposing a documented REST API built with Spring Boot, including JWT authentication, layered architecture and integration tests. Replace this entry with a real project.',
      Url: 'https://github.com/juanvec06/',
      imageLocation: 'assets/portfolio-image.webp'
    },
    // TODO: proyecto de ejemplo generado — reemplazar con datos e imagen reales.
    {
      title: 'Example Project — Data Pipeline',
      description: 'Example placeholder project. A Python data pipeline that ingests, cleans and aggregates datasets, orchestrated with scheduled tasks and containerized with Docker. Replace this entry with a real project.',
      Url: 'https://github.com/juanvec06/',
      imageLocation: 'assets/project-management-image.webp'
    }
  ];

  stars: Star[] = [];

  // --- Estado de la secuencia de imágenes ---
  private ctx: CanvasRenderingContext2D | null = null;
  private frames: HTMLImageElement[] = [];
  private currentFrameIndex = -1;
  private framesActivated = false;
  // Fondo y modo de composición según el tema (ver loadFramesForTheme / drawFrame).
  private bgColor = '#F5EFE6';
  private compositeOp: GlobalCompositeOperation = 'multiply';

  // --- Motor de scroll ---
  private scrollTriggerInstance: { kill: (revert?: boolean) => void } | null = null;

  // --- Observers ---
  private resizeObserver: ResizeObserver | null = null;
  private nearObserver: IntersectionObserver | null = null;

  constructor(
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Al cambiar de tema, si la secuencia ya está activa, recarga los fotogramas
    // del nuevo set (white-tree <-> tree) y redibuja el fotograma actual.
    effect(() => {
      const t = this.theme();
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.framesActivated) return; // esperar a que la sección esté cerca
      this.loadFramesForTheme(t);
    });
  }

  ngOnInit() {
    this.generateStars();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.canvasRef) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d');
      this.resizeCanvas();
    }
    this.setupResizeObserver();
    this.setupNearObserver();
    this.setupMobileHover();
  }

  ngOnDestroy() {
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill(true);
      this.scrollTriggerInstance = null;
    }
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    if (this.nearObserver) { this.nearObserver.disconnect(); this.nearObserver = null; }
    this.frames = [];
  }

  // ------------------------------------------------------------------
  //  Activación diferida (no cargamos ~270 imágenes hasta acercarnos)
  // ------------------------------------------------------------------
  private setupNearObserver() {
    const el = this.pinnedRef?.nativeElement;
    if (!el) { this.activateFrames(); return; }

    this.nearObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this.activateFrames();
        this.nearObserver?.disconnect();
        this.nearObserver = null;
      }
    }, { rootMargin: '200% 0px 200% 0px' }); // empezar a ~2 pantallas de distancia
    this.nearObserver.observe(el);
  }

  private activateFrames() {
    if (this.framesActivated) return;
    this.framesActivated = true;
    this.loadFramesForTheme(this.theme());
    this.setupScrollAnimation();
  }

  // ------------------------------------------------------------------
  //  Carga y dibujo de los fotogramas en el canvas
  // ------------------------------------------------------------------
  private loadFramesForTheme(theme: 'light' | 'dark') {
    // Compositamos dentro del canvas para eliminar el fondo de forma robusta:
    // - claro (tree, árbol verde sobre BLANCO): 'multiply' -> el blanco se funde con el papel.
    // - oscuro (white-tree, árbol BLANCO sobre NEGRO): 'screen' -> el negro se funde con la
    //   página oscura y el árbol blanco queda brillando.
    this.compositeOp = theme === 'dark' ? 'screen' : 'multiply';
    this.bgColor = this.readBackgroundColor(theme);

    const frames: HTMLImageElement[] = new Array(FRAME_COUNT);
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = this.frameUrl(theme, i);
      frames[i] = img;
    }
    this.frames = frames;

    const idx = this.currentFrameIndex < 0 ? 0 : this.currentFrameIndex;
    const active = frames[idx];
    if (active.complete && active.naturalWidth > 0) {
      this.drawFrame(idx, true);
    } else {
      active.onload = () => this.drawFrame(idx, true);
    }
  }

  /**
   * Construye la URL de un fotograma. Cada set usa su propia convención de nombres:
   * - oscuro: assets/white-tree/ezgif-frame-001.jpg
   * - claro:  assets/tree/001_resultado.webp
   */
  private frameUrl(theme: 'light' | 'dark', index: number): string {
    const n = String(index + 1).padStart(3, '0');
    return theme === 'dark'
      ? `assets/white-tree/ezgif-frame-${n}.jpg`
      : `assets/tree/${n}_resultado.webp`;
  }

  /** Lee el color de fondo actual (respeta body.theme-dark); usa fallback si no hay DOM. */
  private readBackgroundColor(theme: 'light' | 'dark'): string {
    const fallback = theme === 'dark' ? '#030014' : '#F5EFE6';
    if (typeof document === 'undefined') return fallback;
    const value = getComputedStyle(document.body).getPropertyValue('--background-color').trim();
    return value || fallback;
  }

  /**
   * Dibuja un fotograma con ajuste "contain" (se ve completo, sin recortes) y
   * compositando dentro del canvas para eliminar el fondo blanco/negro.
   */
  private drawFrame(index: number, force = false) {
    if (!this.ctx || !this.canvasRef) return;
    if (!force && index === this.currentFrameIndex) return;
    const img = this.frames[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    this.currentFrameIndex = index;
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const cw = canvas.width;
    const ch = canvas.height;

    // Base: el color de la página. El composite funde el fondo del fotograma en él.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, cw, ch);

    // Ajuste "contain": la imagen entera cabe dentro del panel (sin recortar).
    // Anclada ABAJO (dy = ch - dh) para que el tronco se apoye en la línea del suelo
    // que se dibuja justo debajo del canvas; horizontalmente sigue centrada.
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2;
    const dy = ch - dh;

    ctx.save();
    ctx.globalCompositeOperation = this.compositeOp;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  private resizeCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.drawFrame(this.currentFrameIndex < 0 ? 0 : this.currentFrameIndex, true);
  }

  private setupResizeObserver() {
    if (!this.canvasRef) return;
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  // ------------------------------------------------------------------
  //  Motor de scroll
  // ------------------------------------------------------------------
  private async setupScrollAnimation() {
    // Import dinámico => GSAP queda en chunks aparte que solo se descargan al acercarse.
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]);
    gsap.registerPlugin(ScrollTrigger);

    this.ngZone.runOutsideAngular(() => {
      if (!this.pinnedRef?.nativeElement) return;
      this.setupScrollSequence(ScrollTrigger);
    });
  }

  /**
   * Pin + scrub: el panel se mantiene a la vista durante PROJECT_COUNT pantallas de
   * scroll y el árbol crece siguiendo el progreso. NO se toca la posición del scroll
   * (sin snap, sin scroll-jack); el `scrub` en segundos hace que el fotograma persiga
   * al scroll con retardo, de ahí la sensación resbaladiza / flotante.
   */
  private setupScrollSequence(ScrollTrigger: any) {
    const pinned = this.pinnedRef!.nativeElement;
    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: pinned,
      start: 'top top',
      end: () => '+=' + (window.innerHeight * PROJECT_COUNT),
      pin: true,
      anticipatePin: 1,
      scrub: 1.2,
      onUpdate: (self: any) => {
        const p = self.progress;
        const frame = Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1)));
        this.drawFrame(frame);
        const idx = Math.min(PROJECT_COUNT - 1, Math.floor(p * PROJECT_COUNT));
        if (idx !== this.activeIndex()) {
          this.ngZone.run(() => this.activeIndex.set(idx));
        }
      }
    });
  }

  // ------------------------------------------------------------------
  //  Efecto hover en móvil (se conserva del diseño anterior)
  // ------------------------------------------------------------------
  private setupMobileHover() {
    if (!this.isMobile()) return;
    const opciones = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.5
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'efecto-hover');
        } else {
          this.renderer.removeClass(entry.target, 'efecto-hover');
        }
      });
    }, opciones);
    this.projectCards.forEach(card => observer.observe(card.nativeElement));
  }

  generateStars() {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2
      });
    }
  }

  openProjectLink(url: string) {
    window.open(url, '_blank');
  }
}
