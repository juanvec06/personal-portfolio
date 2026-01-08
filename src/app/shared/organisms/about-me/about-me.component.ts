import { Component, inject, computed } from '@angular/core';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [SectionTitleComponent],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss'
})
export class AboutMeComponent {
  private themeService = inject(ThemeService);
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
  protected get semester(): number {
    const currentYear = new Date().getFullYear();
    const enrollmentYear = 2022;
    return (currentYear - enrollmentYear) * 2 - (new Date().getMonth() < 7 ? 1 : 0);
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
