import { Injectable, signal } from '@angular/core';

/**
 * Define los tipos de tema permitidos en la aplicación.
 * Restringe los valores posibles a 'light' (claro) o 'dark' (oscuro).
 */
type Theme = 'light' | 'dark';

/**
 * Servicio encargado de la gestión global del tema visual de la aplicación.
 * Maneja la detección de preferencias del sistema, la persistencia de la elección del usuario
 * en el almacenamiento local y la aplicación de clases CSS al documento.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /**
   * Señal reactiva de Angular que mantiene el estado actual del tema.
   * Permite a los componentes suscribirse o reaccionar eficientemente a los cambios de tema.
   * @default 'light'
   */
  public theme = signal<Theme>('light');

  constructor() {
    this.initializeTheme();
  }

  /**
   * Inicializa la configuración del tema al arrancar el servicio.
   * Determina el tema inicial siguiendo una jerarquía de prioridades:
   * 1. Preferencia guardada manualmente por el usuario (localStorage).
   * 2. Preferencia del sistema operativo (media query `prefers-color-scheme`).
   * 3. Tema claro por defecto.
   *
   * También establece un "listener" para reaccionar a cambios en la configuración del sistema operativo
   * si el usuario no ha establecido una preferencia manual.
   */
  private initializeTheme(): void {
    try {
      // 1. Verificamos si existe una preferencia guardada previamente
      const storedTheme = this.getStoredTheme();
      if (storedTheme) {
        this.setTheme(storedTheme);
        return;
      }

      // 2. Si no, detectamos la preferencia del sistema
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.setTheme(prefersDark.matches ? 'dark' : 'light');

        // Escuchamos cambios en tiempo real en la preferencia del sistema
        prefersDark.addEventListener('change', (e) => {
          // Solo aplicamos el cambio del sistema si el usuario NO ha forzado una preferencia manual
          if (!this.getStoredTheme()) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
      } else {
        this.setTheme('light');
      }
    } catch (error) {
      console.warn('Error initializing theme:', error);
      this.setTheme('light');
    }
  }

  /**
   * Obtiene el tema almacenado en localStorage de forma segura.
   */
  private getStoredTheme(): Theme | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('theme') as Theme | null;
      }
    } catch (e) {
      // localStorage puede no estar disponible en algunos navegadores/modos
    }
    return null;
  }

  /**
   * Guarda el tema en localStorage de forma segura.
   */
  private saveTheme(theme: Theme): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    } catch (e) {
      // localStorage puede no estar disponible en algunos navegadores/modos
    }
  }

  /**
   * Alterna el tema actual entre 'light' y 'dark'.
   * Además de actualizar el estado visual, persiste la nueva elección en el localStorage
   * para recordar la preferencia del usuario en futuras visitas.
   */
  public toggleTheme(): void {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    // Persistencia de la elección
    this.saveTheme(newTheme);
  }

  /**
   * Aplica el tema especificado al estado de la aplicación y al DOM.
   * Actualiza la señal `theme` y añade o remueve la clase CSS `theme-dark` en el body
   * para activar las variables CSS correspondientes.
   *
   * @param theme - El tema a aplicar ('light' o 'dark').
   */
  private setTheme(theme: Theme): void {
    try {
      this.theme.set(theme);
      if (typeof document !== 'undefined' && document.body) {
        if (theme === 'dark') {
          document.body.classList.add('theme-dark');
        } else {
          document.body.classList.remove('theme-dark');
        }
      }
    } catch (error) {
      console.warn('Error setting theme:', error);
    }
  }
}