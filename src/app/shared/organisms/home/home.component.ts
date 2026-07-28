import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';
import { LightPillarComponent } from '../../atoms/light-pillar/light-pillar.component';
import { ThemeService } from '../../../core/services/theme.service';
import { DeviceService } from '../../../core/services/device.service';
import { RoleTitleComponent } from '../../atoms/role-title/role-title.component';

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SocialButtonComponent, LightPillarComponent, RoleTitleComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  /**
   * Servicio inyectado encargado de la lógica de negocio del tema.
   */
  public themeService = inject(ThemeService);

  /**
   * Servicio inyectado para detectar si el dispositivo es móvil.
   */
  public deviceService = inject(DeviceService);

  /**
   * Señal reactiva que expone el estado actual del tema ('light' o 'dark').
   * Permite que la plantilla se actualice automáticamente
   * cuando el valor cambia en el servicio.
   */
  public currentTheme = this.themeService.theme;

  /**
   * Señal reactiva que indica si el dispositivo es móvil.
   */
  public isMobile = this.deviceService.isMobile;

  /**
   * Array de estrellas para el efecto de fondo en móvil.
   */
  stars: Star[] = [];

  ngOnInit() {
    if (this.isMobile()) {
      this.generateStars();
    }
  }

  /**
   * Genera estrellas aleatorias para el efecto de fondo.
   */
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
}
