import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';
import { ThemeToggleComponent } from '../../atoms/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, SocialButtonComponent, ThemeToggleComponent],
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.scss'
})
export class MobileMenuComponent {
  @Input() isOpen = false;
  @Input() isMobileView = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
