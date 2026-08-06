import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';
import { LightPillarComponent } from '../../atoms/light-pillar/light-pillar.component';
import { ThemeService } from '../../../core/services/theme.service';
import { RoleTitleComponent } from '../../atoms/role-title/role-title.component';

/** Duración del fundido de entrada del pilar. DEBE coincidir con la transición
 *  de .pillar-background en home.component.scss. */
const PILLAR_FADE_MS = 800;
/** Red de seguridad: si el pilar nunca avisa (WebGL lento, @defer que no
 *  resuelve, pestaña en segundo plano...), mostramos el contenido igualmente. */
const PILLAR_READY_TIMEOUT_MS = 4000;

/**
 * Componente que se encarga de mostrar informacion de introduccion con algunas animaciones que ignoran si tiene prefers-reduced-motion: reduce
 * la animacion se hace con CSS puro en vez de la libreria de Angular por conflictos debido a que el motor de animaciones de Angular SUSPENDE las
 * animaciones de los componentes hijos mientras un ancestro anima, dejando las letras congeladas en opacity: 0.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SocialButtonComponent, LightPillarComponent, RoleTitleComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
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

  /** Paso 1: el pilar pintó su primer frame => arranca su fundido de entrada. */
  public pillarReady = signal(false);

  /** Paso 2: el fundido del pilar terminó => entra el contenido en cascada. */
  public contentReady = signal(false);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private fadeTimeoutId?: ReturnType<typeof setTimeout>;
  private safetyTimeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    if (!this.isBrowser) {
      // Sin navegador no hay pilar ni animaciones: renderizar todo de una vez
      // para que el contenido exista siempre en el HTML servido.
      this.pillarReady.set(true);
      this.contentReady.set(true);
      return;
    }

    // Si el pilar no avisa a tiempo, seguimos adelante igual.
    this.safetyTimeoutId = setTimeout(() => this.onPillarReady(), PILLAR_READY_TIMEOUT_MS);
  }

  ngOnDestroy() {
    clearTimeout(this.fadeTimeoutId);
    clearTimeout(this.safetyTimeoutId);
  }

  /**
   * Encadena la secuencia: primer frame del pilar -> fundido -> contenido.
   * Es idempotente a propósito: al cambiar de tema se destruye un pilar y se
   * crea otro (nuevo 'ready'), pero el contenido no debe volver a animarse.
   */
  public onPillarReady() {
    if (this.pillarReady()) return;

    clearTimeout(this.safetyTimeoutId);
    this.pillarReady.set(true);

    // Esperar a que termine el fundido del pilar antes de mostrar el contenido.
    this.fadeTimeoutId = setTimeout(() => this.contentReady.set(true), PILLAR_FADE_MS);
  }
}
