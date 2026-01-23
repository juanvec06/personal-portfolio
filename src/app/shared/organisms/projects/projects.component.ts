import { Component , inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { DeviceService } from '../../../core/services/device.service';

interface Project {
  title: string;
  description: string;
  Url: string;
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
  public deviceService = inject(DeviceService);

  /**
   * Señal reactiva que indica si el dispositivo es móvil.
   */
  public isMobile = this.deviceService.isMobile;
  projects: Project[] = [
    {
      title: 'Appointments and administrative utilities Manager System',
      description: 'Complete application for appointment management and administrative utilities developed with Angular and Spring Boot. It features user authentication, role-based access control, and a responsive design for optimal performance across devices.',
      Url: "https://github.com/juanvec06/api-gateway-barbershop"
    },
    {
      title: 'Personal Portfolio',
      description: 'Personal Portfolio Website Designed and engineered a high-performance personal website using Angular and TypeScript to showcase technical expertise and project milestones.',
      Url: "https://carlosmario.vercel.app/"
    },
    {
      title: 'Academic Project Management System',
      description: 'microservices-based platform designed to streamline the management of academic projects by facilitating collaboration between students, companies, and coordinators. It was an academic project developed using Java with Spring Boot for the backend and Java Swing for the frontend.',
      Url: "https://github.com/paulamunoz06/GestionProyectosMicro/tree/main"
    },
    {
      title: 'Spotify Clone',
      description: 'Project that simulates the main functionalities of Spotify using Golang and Java for the backend and HTML/CSS/JavaScript for the frontend, it uses Rest API, websockets and GRPC for communication between services.',
      Url: "https://github.com/juanvec06/SpotifyFake2.0",
    }
  ];

  stars: Star[] = [];

  ngOnInit() {
    this.generateStars();
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
