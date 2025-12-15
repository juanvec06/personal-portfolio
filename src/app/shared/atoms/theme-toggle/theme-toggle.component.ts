import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CommonModule } from '@angular/common';

/**
 * Componente atómico que proporciona un interruptor (toggle) para cambiar el tema visual de la aplicación.
 * Interactúa directamente con el `ThemeService` para alternar entre los modos Claro y Oscuro
 * y reacciona a los cambios de estado globales.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent {
  /**
   * Servicio inyectado encargado de la lógica de negocio del tema.
   */
  public themeService = inject(ThemeService);

  /**
   * Señal reactiva que expone el estado actual del tema ('light' o 'dark').
   * Permite que la plantilla se actualice automáticamente (ej. cambiando el ícono)
   * cuando el valor cambia en el servicio.
   */
  public currentTheme = this.themeService.theme;

  /**
   * Ejecuta la acción de cambio de tema invocando al servicio.
   * Usualmente vinculado al evento de clic del botón en la plantilla.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}