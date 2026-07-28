import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  Input,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  trigger,
  animate,
  style,
  transition,
  query,
  stagger,
} from '@angular/animations';

// Retraso entre letra y letra. Va como constante (y no como @Input) porque
// stagger() se resuelve al compilar el trigger, no en cada render.
const CHAR_STAGGER_MS = 50;

@Component({
  selector: 'app-role-title',
  standalone: true,
  imports: [],
  templateUrl: './role-title.component.html',
  styleUrl: './role-title.component.scss',
  animations: [
    // "rollChars": el trigger vive en la palabra completa (entra/sale como una
    // unidad), pero la animación se aplica letra por letra con query('.char').
    // stagger() retrasa cada letra respecto a la anterior => efecto de ola.
    trigger('rollChars', [
      transition(':enter', [
        query(
          '.char',
          [
            style({ transform: 'translateY(100%)', opacity: 0 }),
            stagger(CHAR_STAGGER_MS, [
              animate('0.5s ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
            ]),
          ],
          { optional: true }
        ),
      ]),
      transition(':leave', [
        query(
          '.char',
          [
            stagger(CHAR_STAGGER_MS, [
              animate('0.5s ease-in', style({ transform: 'translateY(-100%)', opacity: 0 })),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class RoleTitleComponent implements OnInit, OnDestroy {
  // Palabras a rotar dentro del título.
  @Input() words: string[] = ['Systems', 'Software', 'AI'];
  // Color del texto. Si no se pasa, el SCSS usa var(--contrast-text-color).
  @Input() color?: string;
  // Fuente del texto. Si no se pasa, hereda la del contenedor.
  @Input() font?: string;
  // Milisegundos que cada palabra permanece visible.
  @Input() interval: number = 2000;

  // Palabra visible actualmente.
  currentWord = signal('');
  // Palabra más larga: reserva el espacio para que el texto contiguo no se mueva.
  longestWord = signal('');

  private index = 0;
  private intervalId?: ReturnType<typeof setInterval>;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    this.currentWord.set(this.words[0] ?? '');
    this.longestWord.set(
      this.words.reduce((a, b) => (b.length > a.length ? b : a), this.words[0] ?? '')
    );

    // El ciclo solo tiene sentido en el navegador (evita correr en SSR/prerender).
    if (this.isBrowser && this.words.length > 1) {
      this.intervalId = setInterval(() => {
        this.index = (this.index + 1) % this.words.length;
        this.currentWord.set(this.words[this.index]);
      }, this.interval);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
