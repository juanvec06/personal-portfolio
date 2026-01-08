import { Component, Input, ElementRef, AfterViewInit, OnDestroy, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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
  @Input() iconType: 'class' | 'src' = 'class';
  @Input() glowColor: string = '132, 0, 255';

  private cardElement: HTMLElement | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseLeave: (() => void) | null = null;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.cardElement = this.el.nativeElement.querySelector('.skill-card');
    if (!this.cardElement) return;

    this.ngZone.runOutsideAngular(() => {
      this.boundMouseMove = this.handleMouseMove.bind(this);
      this.boundMouseLeave = this.handleMouseLeave.bind(this);

      this.cardElement?.addEventListener('mousemove', this.boundMouseMove);
      this.cardElement?.addEventListener('mouseleave', this.boundMouseLeave);
    });
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
