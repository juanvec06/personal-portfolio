import { Component , inject, ElementRef, Renderer2, QueryList, ViewChildren} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { DeviceService } from '../../../core/services/device.service';

interface Project {
  title: string;
  description: string;
  Url: string;
  imageLocation: string;
}
interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  /**
   * Servicio inyectado para detectar si el dispositivo es móvil.
   */
  protected deviceService = inject(DeviceService);

  /**
   * Señal reactiva que indica si el dispositivo es móvil.
   */
  protected isMobile = this.deviceService.isMobile;
  /**
   * Referencia a las tarjetas de proyecto.
   */
  @ViewChildren('projectCard') projectCards!: QueryList<ElementRef>;
  projects: Project[] = [
    {
      title: 'Appointments and administrative utilities Manager System',
      description: 'Developed as an academic project, this application manages appointments and administrative tasks for barbershops. Built with Angular and Spring Boot, it features user authentication, role-based access control, and a responsive design for optimal performance across devices.',
      Url: "https://github.com/juanvec06/api-gateway-barbershop",
      imageLocation: 'assets/appointment-management-image.webp'
    },
    {
      title: 'Personal Portfolio',
      description: 'Personal Portfolio Website, i engineered a personal website using Angular and TypeScript to showcase technical expertise and project milestones.',
      Url: "https://juandavidvelacoronado.vercel.app/",
      imageLocation: 'assets/portfolio-image.webp'
    },
    {
      title: 'Academic Project Management System',
      description: 'Developed as an academic project, this microservices-based platform is designed to streamline the management of academic projects by facilitating collaboration between students, companies, and coordinators. It was developed using Java with Spring Boot for the backend and Java Swing for the frontend.',
      Url: "https://github.com/paulamunoz06/GestionProyectosMicro/tree/main",
      imageLocation: 'assets/project-management-image.webp'
    }
  ];

  stars: Star[] = [];

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.generateStars();
  }
  ngAfterViewInit() {
    if(this.isMobile()) {
      const opciones = {
        root: null, // usa el viewport del dispositivo
        rootMargin: '-30% 0px -30% 0px', // Solo activa cuando está cerca del centro ignorando 30% de arriba y abajo
        threshold: 0.5 // se activa cuando el 50% del elemento es visible
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Añadimos una clase que simula el hover al elemento que intersecta
            this.renderer.addClass(entry.target, 'efecto-hover');
          } else {
            this.renderer.removeClass(entry.target, 'efecto-hover');
          }
        });
      }, opciones);

      // Observar cada tarjeta de proyecto
      this.projectCards.forEach(card => {
        observer.observe(card.nativeElement);
      });
    }
  }
  generateStars() {
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
  
  openProjectLink(url: string) {
    window.open(url, '_blank');
  }
}
