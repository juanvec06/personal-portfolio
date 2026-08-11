import { inject, Component, Input, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, Renderer2, ViewChildren, QueryList} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DeviceService } from '../../../core/services/device.service';

@Component({
  selector: 'app-skill-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-card.component.html',
  styleUrl: './skill-card.component.scss'
})
export class SkillCardComponent implements AfterViewInit, OnDestroy {
  @Input() name: string = '';
  @Input() icon: string = '';
  // Depending on whether the icon is a class or a src URL style changes, it must be indicated
  @Input() iconType: 'class' | 'src' = 'class';
  @Input() glowColor: string = '132, 0, 255';

  // References to skill card elements for movile effect
  @ViewChildren('skillCard') skillCards!: QueryList<ElementRef>;

  private deviceService = inject(DeviceService);
  private observer: IntersectionObserver | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // En escritorio no se hace NADA por JS: la tarjeta debe quedarse quieta al
    // pasar el ratón, así que el hover es puramente CSS y sin movimiento.
    if (!this.deviceService.isMobile()) return;

    // En móvil no hay hover: la tarjeta se "enciende" cuando entra en la banda
    // central de la pantalla y su borde cónico empieza a girar (ver
    // .animate_skillcard en el SCSS).
    const options = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'animate_skillcard');
        } else {
          this.renderer.removeClass(entry.target, 'animate_skillcard');
        }
      });
    }, options);

    this.skillCards.forEach((card) => {
      this.observer?.observe(card.nativeElement);
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.observer = null;
  }
}
