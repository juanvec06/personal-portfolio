import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit, NgZone, PLATFORM_ID, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { 
  Scene, 
  OrthographicCamera, 
  WebGLRenderer, 
  ShaderMaterial, 
  Vector2, 
  Vector3,
  Color, 
  PlaneGeometry, 
  Mesh
} from 'three';

// Configuración de calidad para diferentes dispositivos
type QualityLevel = 'low' | 'medium';

interface QualitySettings {
  iterations: number;
  waveIterations: number;
  pixelRatio: number;
  precision: string;
  stepMultiplier: number;
  targetFPS: number;
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.5, targetFPS: 30 },
  medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, precision: 'mediump', stepMultiplier: 1.2, targetFPS: 60 }
};

@Component({
  selector: 'app-light-pillar',
  standalone: true,
  template: `<div #container class="light-pillar-container" [style.mix-blend-mode]="mixBlendMode"></div>
             @if (!webGLSupported) {
               <div class="light-pillar-fallback" [class]="className" [style.mix-blend-mode]="mixBlendMode">
                 WebGL not supported
               </div>
             }`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .light-pillar-container {
      width: 100%;
      height: 100%;
    }
    .light-pillar-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: white;
    }
  `]
})
export class LightPillarComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() topColor = '#5227FF';
  @Input() bottomColor = '#FF9FFC';
  @Input() intensity = 1.0;
  @Input() rotationSpeed = 0.3;
  @Input() interactive = false;
  @Input() className = '';
  @Input() glowAmount = 0.005;
  @Input() pillarWidth = 3.0;
  @Input() pillarHeight = 0.4;
  @Input() noiseIntensity = 0.5;
  @Input() mixBlendMode = 'screen';
  @Input() pillarRotation = 0;
  @Input() quality: QualityLevel = 'medium'; // Nueva prop para controlar calidad
  // Forma del pilar: 'max' = intersección suave (aspecto filamentoso, "modo oscuro"),
  // 'min' = unión suave (aspecto más sólido). Antes se derivaba del tema; ahora es un input
  // para que ambos temas puedan compartir la misma forma. Ver blendMax/blendMin en el shader.
  @Input() blendMode: 'max' | 'min' = 'max';
  // Modo claro ("tinta sobre papel"): en lugar de un pilar aditivo brillante sobre
  // fondo negro OPACO (que en una página clara se ve como un rectángulo negro), el
  // shader pinta un fondo TRANSPARENTE y usa el brillo del pilar como alpha para
  // dibujar una "tinta" de color oscuro. Así la página clara se ve a través.
  @Input() lightMode = false;

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  webGLSupported = true;
  
  private renderer: WebGLRenderer | null = null;
  private material: ShaderMaterial | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private geometry: PlaneGeometry | null = null;
  
  private rafId: number | null = null;
  private mouse = new Vector2(0, 0);
  private time = 0;
  private resizeObserver: ResizeObserver | null = null;
  // Observador de visibilidad: pausa el render cuando el pilar sale del viewport
  private intersectionObserver: IntersectionObserver | null = null;
  // Estado de la puerta de renderizado (solo animamos si está en pantalla Y la pestaña activa)
  private isIntersecting = true;
  private isPageVisible = true;
  
  // Nuevas propiedades para optimización
  private qualitySettings: QualitySettings = QUALITY_PRESETS.medium;
  private lastFrameTime = 0;
  private frameTime = 1000 / 60;
  private mouseMoveThrottleId: number | null = null;
  private resizeDebounceId: number | null = null;
  
  // Valores precalculados para evitar cálculos en el shader
  private waveSin = Math.sin(0.4);
  private waveCos = Math.cos(0.4);

  /**
   * 
   * @param platformId Se usa para identificar si se esta corriendo en un navegador, es un valor que por defecto es inyectado
   * @param ngZone Se usa para correr el bucle de animación fuera de Angular y evitar detecciones de cambios innecesarias
   */
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {}
  /**
   * Inicializa el componente, verifica si WebGL está soportado en el navegador y cambia configuraciones del shader dependiendo del dispositivo que esté utilizando usando 'detectDeviceCapabilities()'.
   */
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          this.webGLSupported = false;
          console.warn('WebGL is not supported in this browser');
        }
        canvas.remove();
        
        // Detectar capacidades del dispositivo y ajustar calidad
        this.detectDeviceCapabilities();
      } catch (error) {
        console.warn('Error checking WebGL support:', error);
        this.webGLSupported = false;
      }
    }
  }
  
  /**
   * Detecta las capacidades del dispositivo y ajusta la calidad automáticamente.
   * Esto mejora el rendimiento en dispositivos móviles y de bajo rendimiento.
   */
  private detectDeviceCapabilities() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Solo usamos los presets 'low' y 'medium'. En móvil forzamos 'low'
    // para reducir la carga de GPU; en escritorio se mantiene la calidad solicitada.
    let effectiveQuality = this.quality;
    if (isMobile && this.quality !== 'low') {
      effectiveQuality = 'low';
    }

    this.qualitySettings = { ...QUALITY_PRESETS[effectiveQuality] };

    // Calcular frame time según FPS objetivo
    this.frameTime = 1000 / this.qualitySettings.targetFPS;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.material) return;

    if (changes['topColor']) {
      const color = new Color(this.topColor);
      this.material.uniforms['uTopColor'].value.set(color.r, color.g, color.b);
    }
    if (changes['bottomColor']) {
      const color = new Color(this.bottomColor);
      this.material.uniforms['uBottomColor'].value.set(color.r, color.g, color.b);
    }
    if (changes['intensity']) {
      this.material.uniforms['uIntensity'].value = this.intensity;
    }
    if (changes['pillarRotation']) {
      const pillarRotRad = (this.pillarRotation * Math.PI) / 180;
      this.material.uniforms['uPillarRotCos'].value = Math.cos(pillarRotRad);
      this.material.uniforms['uPillarRotSin'].value = Math.sin(pillarRotRad);
    }
  }

  ngAfterViewInit() {
    if (!this.webGLSupported || !isPlatformBrowser(this.platformId)) return;

    try {
      this.initThree();
      // Activar la puerta de visibilidad una sola vez (el contenedor persiste
      // aunque se reinicie Three.js al cambiar de tema).
      this.setupVisibilityGating();
    } catch (error) {
      console.warn('Error initializing Three.js in ngAfterViewInit:', error);
      this.webGLSupported = false;
    }
  }

  ngOnDestroy() {
    this.cleanup();
    this.teardownVisibilityGating();
  }

  /**
   * Configura la pausa/reanudación del render según la visibilidad:
   * - IntersectionObserver: pausa cuando el pilar sale del viewport.
   * - visibilitychange: pausa cuando la pestaña pasa a segundo plano.
   * Así la GPU solo trabaja mientras el héroe está realmente a la vista.
   */
  private setupVisibilityGating() {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.isIntersecting = entries[0]?.isIntersecting ?? true;
      this.updateRenderLoop();
    }, { threshold: 0 });
    this.intersectionObserver.observe(container);

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private teardownVisibilityGating() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    this.isPageVisible = !document.hidden;
    this.updateRenderLoop();
  };

  /**
   * Arranca o detiene el bucle de render según el estado de visibilidad,
   * sin destruir ni reconstruir el contexto WebGL (reanudación instantánea).
   */
  private updateRenderLoop() {
    if (this.isIntersecting && this.isPageVisible) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  private startAnimation() {
    // Evitar programar el RAF más de una vez.
    if (this.rafId !== null) return;
    if (!this.material || !this.renderer || !this.scene || !this.camera) return;
    this.lastFrameTime = performance.now();
    this.ngZone.runOutsideAngular(() => this.animate(performance.now()));
  }

  private stopAnimation() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private initThree() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const settings = this.qualitySettings;
    // La forma del pilar se hornea en el código fuente del shader (no es un uniform),
    // por eso se decide aquí a partir del input blendMode.
    const blendExpr = this.blendMode === 'max'
      ? 'blendMax(bound, d, 1.0)'
      : 'blendMin(bound, d, 1.0)';

    this.scene = new Scene();
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    try {
      this.renderer = new WebGLRenderer({
        antialias: false, // Antialiasing
        alpha: true, // Transparencia
        // Solo usamos presets 'low'/'medium', por lo que priorizamos ahorro de batería
        powerPreference: 'low-power',
        precision: settings.precision as 'highp' | 'mediump' | 'lowp',
        stencil: false, // no entendí que carajos es pero ahorra recursos
        depth: false // deja de calcular qué objeto está delante de otro en el espacio 3D
      });
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      this.webGLSupported = false;
      return;
    }

    this.renderer.setSize(width, height);
    // Usar pixel ratio de la configuración de calidad
    this.renderer.setPixelRatio(settings.pixelRatio);
    container.appendChild(this.renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Shader optimizado con iteraciones configurables y funciones trigonométricas precalculadas
    const fragmentShader = `
      precision ${settings.precision} float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform bool uLightMode;
      // Valores precalculados de sin/cos para evitar cálculos en el shader
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin;
      uniform float uWaveCos;
      varying vec2 vUv;

      // Constantes para optimización - step multiplier aumenta el paso en calidades bajas
      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};
      const int MAX_ITER = ${settings.iterations};
      const int WAVE_ITER = ${settings.waveIterations};

      float blendMin(float a, float b, float k) {
        float scaledK = k * 4.0;
        float h = max(scaledK - abs(a - b), 0.0);
        return min(a, b) - h * h * 0.25 / scaledK;
      }

      float blendMax(float a, float b, float k) {
        return -blendMin(-a, -b, k);
      }

      void main() {
        // Simplificado: cálculo de UV más eficiente
        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
        // Rotación usando valores precalculados
        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

        vec3 ro = vec3(0.0, 0.0, -10.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        // Usar valores precalculados en lugar de calcular sin/cos por píxel
        float rotC = uRotCos;
        float rotS = uRotSin;
        if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
          float a = uMouse.x * 6.283185;
          rotC = cos(a);
          rotS = sin(a);
        }

        vec3 col = vec3(0.0);
        float t = 0.1;
        
        // Bucle con iteraciones configurables según calidad
        for(int i = 0; i < MAX_ITER; i++) {
          vec3 p = ro + rd * t;
          // Rotación inline más eficiente
          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

          vec3 q = p;
          q.y = p.y * uPillarHeight + uTime;
          
          float freq = 1.0;
          float amp = 1.0;
          // Iteraciones de onda reducidas en calidades bajas
          for(int j = 0; j < WAVE_ITER; j++) {
            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
            freq *= 2.0;
            amp *= 0.5;
          }
          
          float d = length(cos(q.xz)) - 0.2;
          float bound = length(p.xz) - uPillarWidth;
          d = ${blendExpr};
          d = abs(d) * 0.15 + 0.01;

          // Gradiente simplificado
          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
          col += mix(uBottomColor, uTopColor, grad) / d;

          // Step multiplier para terminar antes en calidades bajas
          t += d * STEP_MULT;
          if(t > 50.0) break;
        }

        float widthNorm = uPillarWidth / 3.0;
        col = tanh(col * uGlowAmount / widthNorm);
        
        // Ruido simplificado
        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;

        if (uLightMode) {
          // MODO CLARO ("tinta sobre papel"): fondo TRANSPARENTE, pilar de color oscuro.
          // 'lum' = brillo del pilar (0 donde no hay pilar). Lo usamos como alpha, así el
          // fondo queda transparente y la página clara se ve a través: NO hay rectángulo
          // negro. El color 'ink' sigue un degradado vertical entre bottom/top (verdes
          // oscuros pasados por input) para verse como una silueta impresa sobre el papel.
          float lum = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
          vec3 ink = mix(uBottomColor, uTopColor, clamp(vUv.y, 0.0, 1.0));
          gl_FragColor = vec4(ink, lum * uIntensity);
        } else {
          // MODO OSCURO: pilar aditivo brillante sobre fondo negro opaco.
          gl_FragColor = vec4(col * uIntensity, 1.0);
        }
      }
    `;

    // Precalcular valores trigonométricos
    const pillarRotRad = (this.pillarRotation * Math.PI) / 180;
    
    // Parsear colores a Vector3 para mejor rendimiento
    const topColorParsed = new Color(this.topColor);
    const bottomColorParsed = new Color(this.bottomColor);

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(width, height) },
        uMouse: { value: this.mouse },
        uTopColor: { value: new Vector3(topColorParsed.r, topColorParsed.g, topColorParsed.b) },
        uBottomColor: { value: new Vector3(bottomColorParsed.r, bottomColorParsed.g, bottomColorParsed.b) },
        uIntensity: { value: this.intensity },
        uInteractive: { value: this.interactive },
        uGlowAmount: { value: this.glowAmount },
        uPillarWidth: { value: this.pillarWidth },
        uPillarHeight: { value: this.pillarHeight },
        uNoiseIntensity: { value: this.noiseIntensity },
        uLightMode: { value: this.lightMode },
        // Valores precalculados - evita cálculos de sin/cos en el shader
        uRotCos: { value: 1.0 },
        uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) },
        uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: this.waveSin },
        uWaveCos: { value: this.waveCos }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    this.geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(this.geometry, this.material);
    this.scene.add(mesh);

    if (this.interactive) {
      this.ngZone.runOutsideAngular(() => {
        container.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
      });
    }

    // Usar ResizeObserver con debounce para mejor rendimiento
    this.resizeObserver = new ResizeObserver(() => this.handleResizeDebounced());
    this.resizeObserver.observe(container);

    // Arrancar el bucle solo si el pilar está visible (respeta la puerta de visibilidad).
    // Al reinicializar por cambio de tema, no se reanuda si el héroe está fuera de pantalla.
    this.updateRenderLoop();
  }

  /**
   * Maneja el movimiento del mouse con throttling para evitar actualizaciones excesivas.
   * Limita las actualizaciones a ~60fps máximo.
   */
  private handleMouseMove(event: MouseEvent) {
    if (!this.interactive || !this.renderer) return;

    // Throttle: ignorar eventos si ya hay uno pendiente
    if (this.mouseMoveThrottleId !== null) return;

    this.mouseMoveThrottleId = window.setTimeout(() => {
      this.mouseMoveThrottleId = null;
    }, 16); // ~60fps

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.mouse.set(x, y);
  }

  /**
   * Maneja el resize con debounce para evitar recálculos excesivos durante el redimensionamiento.
   */
  private handleResizeDebounced() {
    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
    }

    this.resizeDebounceId = window.setTimeout(() => {
      this.handleResize();
      this.resizeDebounceId = null;
    }, 150); // Debounce de 150ms
  }

  private handleResize() {
    if (!this.renderer || !this.material || !this.containerRef) return;
    
    const container = this.containerRef.nativeElement;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    this.renderer.setSize(newWidth, newHeight);
    this.material.uniforms['uResolution'].value.set(newWidth, newHeight);
  }

  /**
   * Loop de animación optimizado con frame rate limitado según la calidad.
   * En dispositivos de baja gama, limita a 30fps para reducir carga de GPU.
   */
  private animate(currentTime: number) {
    if (!this.material || !this.renderer || !this.scene || !this.camera) return;

    const deltaTime = currentTime - this.lastFrameTime;

    // Solo renderizar si ha pasado suficiente tiempo (frame rate limiting)
    if (deltaTime >= this.frameTime) {
      this.time += 0.016 * this.rotationSpeed;
      const t = this.time;
      
      // Actualizar uniforms
      this.material.uniforms['uTime'].value = t;
      // Precalcular sin/cos en JS en lugar de en el shader (mucho más eficiente)
      this.material.uniforms['uRotCos'].value = Math.cos(t * 0.3);
      this.material.uniforms['uRotSin'].value = Math.sin(t * 0.3);
      
      this.renderer.render(this.scene, this.camera);
      
      // Ajustar lastFrameTime para mantener frame rate consistente
      this.lastFrameTime = currentTime - (deltaTime % this.frameTime);
    }

    this.rafId = requestAnimationFrame((time) => this.animate(time));
  }

  private cleanup() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Limpiar timeouts pendientes
    if (this.mouseMoveThrottleId !== null) {
      clearTimeout(this.mouseMoveThrottleId);
      this.mouseMoveThrottleId = null;
    }
    
    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
      this.resizeDebounceId = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.containerRef?.nativeElement?.contains(this.renderer.domElement)) {
        this.containerRef.nativeElement.removeChild(this.renderer.domElement);
      }
    }
    
    if (this.material) {
      this.material.dispose();
    }
    
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.renderer = null;
    this.material = null;
    this.scene = null;
    this.camera = null;
    this.geometry = null;
  }
}