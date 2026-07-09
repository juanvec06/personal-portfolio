import { Component, inject, computed, OnInit } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { ThemeService } from '../../../core/services/theme.service';

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [SectionTitleComponent, NgOptimizedImage, CommonModule],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss'
})
export class AboutMeComponent implements OnInit {
  private themeService = inject(ThemeService);

  /** Estrellas de fondo (mismo efecto que la sección de proyectos). */
  stars: Star[] = [];

  ngOnInit() {
    this.generateStars();
  }

  private generateStars() {
    const starCount = 100; // Cantidad de estrellas
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1, // Tamaño entre 1px y 4px
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2 // Duración entre 2s y 5s
      });
    }
  }
  private birthDate = new Date(2006, 6, 6);
  protected get age(): number {
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDifference = today.getMonth() - this.birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }
    return age;
  }
  /**
   * Calcula el semestre actual del estudiante basado en la fecha de inicio de la carrera (1 de julio de 2022) y la fecha actual convirtiendolos a milisecundos, despues a meses y despues a semestres.
   * Se asume que cada semestre dura 6 meses.
   * @returns El número de semestre actual.
   */
  protected get semester(): number {
    const current = new Date();
    const enrollment = new Date('2022-07-01T00:00:00Z'); // Fecha de inicio de carrera
    return Math.ceil((Math.floor((current.getTime() - enrollment.getTime()) / (1000 * 60 * 60 * 24 * 30))) / 6);
  }
  profileImage = computed(() => 
    this.themeService.theme() === 'dark' 
      ? 'assets/about-me-dark.webp' 
      : 'assets/about-me-light.webp'
  );

  pillarTopColor = computed(() => 
    this.themeService.theme() === 'dark' 
      ? '#5227FF' 
      : '#007bff'
  );

  pillarBottomColor = computed(() => 
    this.themeService.theme() === 'dark' 
      ? '#FF9FFC' 
      : '#00d4ff'
  );
}
