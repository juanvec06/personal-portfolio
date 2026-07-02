import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../../atoms/theme-toggle/theme-toggle.component';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';
import { MobileMenuComponent } from '../mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, SocialButtonComponent, MobileMenuComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  // Placeholder image for now
  profileImage = 'assets/code.webp';
  // We use this for the mobile menu to determine if we should show the mobile menu or not
  isMobileView = window.innerWidth < 768;

  // Logic to handle the mobile menu state with boolean variable and methods to toggle and close the menu
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
