import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';
import { LightPillarComponent } from '../../atoms/light-pillar/light-pillar.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SocialButtonComponent, LightPillarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  /**
   * Servicio inyectado encargado de la lógica de negocio del tema.
   */
  public themeService = inject(ThemeService);

  /**
   * Señal reactiva que expone el estado actual del tema ('light' o 'dark').
   * Permite que la plantilla se actualice automáticamente
   * cuando el valor cambia en el servicio.
   */
  public currentTheme = this.themeService.theme;

  ngOnInit() {
  }
}
