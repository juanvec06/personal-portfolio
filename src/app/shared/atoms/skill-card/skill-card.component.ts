import { inject, Component, Input, ElementRef, AfterViewInit, OnDestroy, NgZone, PLATFORM_ID, Inject, Renderer2, ViewChildren, QueryList} from '@angular/core';
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

  private cardElement: HTMLElement | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseLeave: (() => void) | null = null;
  private deviceService = inject(DeviceService);


  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Hover effect disabled on mobile devices
    if (this.deviceService.isMobile()){
      const options = {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'animate_skillcard');
          }else{
            this.renderer.removeClass(entry.target, 'animate_skillcard');
          }
        });
      }, options);

      this.skillCards.forEach((card) => {
        observer.observe(card.nativeElement);
      });
      return;
    }
    else{
      this.cardElement = this.el.nativeElement.querySelector('.skill-card');
      if (!this.cardElement) return;
      this.ngZone.runOutsideAngular(() => {
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseLeave = this.handleMouseLeave.bind(this);

        this.cardElement?.addEventListener('mousemove', this.boundMouseMove);
        this.cardElement?.addEventListener('mouseleave', this.boundMouseLeave);
      });
    }
  }

  ngOnDestroy() {
    if (this.cardElement && this.boundMouseMove && this.boundMouseLeave) {
      this.cardElement.removeEventListener('mousemove', this.boundMouseMove);
      this.cardElement.removeEventListener('mouseleave', this.boundMouseLeave);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.cardElement) return;

    const rect = this.cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Glow position
    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;

    this.cardElement.style.setProperty('--glow-x', `${relativeX}%`);
    this.cardElement.style.setProperty('--glow-y', `${relativeY}%`);
    this.cardElement.style.setProperty('--glow-intensity', '1');

    // Tilt effect
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    this.cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }

  private handleMouseLeave() {
    if (!this.cardElement) return;

    this.cardElement.style.setProperty('--glow-intensity', '0');
    this.cardElement.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  }
}
