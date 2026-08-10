import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../atoms/section-title/section-title.component';
import { SkillCardComponent } from '../../atoms/skill-card/skill-card.component';

interface Skill {
  name: string;
  icon: string;
  iconType?: 'class' | 'src';
}

interface SkillCategory {
  title: string;
  glowColor: string;
  skills: Skill[];
}

/** Una categoría ya preparada para el carrusel infinito. */
interface MarqueeCategory extends SkillCategory {
  /** Lista repetida hasta llenar el ancho (ver MIN_TRACK_ITEMS). */
  items: Skill[];
  /** Duración calculada para que todas las filas vayan a la misma velocidad. */
  durationSec: number;
  /** Filas alternas se desplazan en sentido contrario. */
  reverse: boolean;
}

/** Ancho de tarjeta + hueco, en px (ver `.group app-skill-card` y el gap). */
const ITEM_WIDTH_PX = 120 + 16;
/** Ancho máximo del carrusel (ver `.container { max-width }` en el SCSS). */
const CONTAINER_MAX_WIDTH_PX = 1200;

/**
 * Mínimo de tarjetas por grupo.
 *
 * El bucle se apoya en dos grupos idénticos: al final del ciclo el primero ya
 * salió por completo y el segundo ocupa su lugar. Para que NUNCA se vea un
 * hueco, cada grupo debe ser al menos tan ancho como el carrusel; si no, al
 * terminar el recorrido queda espacio vacío a la derecha (le pasaba a
 * "Backend" con 8 tarjetas: 1088px de grupo contra 1200px de contenedor).
 * Repetimos la lista hasta cubrir ese ancho, con una tarjeta de margen.
 */
const MIN_TRACK_ITEMS = Math.ceil(CONTAINER_MAX_WIDTH_PX / ITEM_WIDTH_PX) + 1;

/**
 * Segundos por tarjeta. La animación recorre el 100% del ancho del grupo, así
 * que una duración fija haría que las filas con más tarjetas fuesen más
 * rápidas. Escalando con el número de tarjetas, todas van igual de lentas.
 */
const SECONDS_PER_ITEM = 2.5;

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, SkillCardComponent],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss'
})
export class SkillsComponent {
  skillCategories: SkillCategory[] = [
    {
      title: 'Backend',
      glowColor: '0, 150, 136',
      skills: [
        { name: 'Java', icon: 'https://www.svgrepo.com/show/394230/java.svg', iconType: 'src' },
        { name: 'Spring Boot', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Spring_Boot.svg/960px-Spring_Boot.svg.png', iconType: 'src' },
        { name: 'Python', icon: 'https://www.svgrepo.com/show/512738/python-127.svg', iconType: 'src' },
        { name: 'Golang', icon: 'https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Aqua.svg' , iconType: 'src' },
        { name: 'Node.js', icon: 'https://www.svgrepo.com/show/508935/nodejs02.svg', iconType: 'src' },
        { name: 'PostgreSQL', icon: 'bi bi-database' },
        { name: 'MariaDB', icon: 'https://www.svgrepo.com/show/354037/mariadb-icon.svg', iconType: 'src' },
        { name: 'OracleDB', icon: 'https://www.svgrepo.com/show/448245/oracle.svg', iconType: 'src' }
      ]
    },
    {
      title: 'Frontend',
      glowColor: '33, 150, 243',
      skills: [
        { name: 'Angular', icon: 'https://www.svgrepo.com/show/473537/angular.svg', iconType: 'src' },
        { name: 'TypeScript', icon: 'bi bi-typescript' },
        { name: 'HTML5', icon: 'bi bi-filetype-html' },
        { name: 'CSS3', icon: 'bi bi-filetype-css' },
        { name: 'JavaScript', icon: 'bi bi-javascript' },
        { name: 'Bootstrap', icon: 'bi bi-bootstrap' }
      ]
    },
    {
      title: 'Learning',
      glowColor: '255, 152, 0',
      skills: [
        { name: 'Docker', icon: 'bi bi-box' },
        { name: 'Kubernetes', icon: 'bi bi-boxes' },
        { name: 'AWS', icon: 'bi bi-cloud' }
      ]
    },
    {
      title: 'Tools',
      glowColor: '156, 39, 176',
      skills: [
        { name: 'Git', icon: 'bi bi-git' },
        { name: 'GitHub', icon: 'bi bi-github' },
        { name: 'VS Code', icon: 'https://www.svgrepo.com/show/342347/visual-studio-code.svg', iconType: 'src' },
        { name: 'IntelliJ', icon: 'bi bi-braces' },
        { name: 'Postman', icon: 'https://www.svgrepo.com/show/306590/postman.svg', iconType: 'src' },
        { name: 'Linux', icon: 'bi bi-ubuntu' }
      ]
    }
  ];

  /**
   * Categorías preparadas para el carrusel. Se calcula UNA vez al construir el
   * componente: si se hiciera con un método llamado desde la plantilla, se
   * generarían arrays nuevos en cada ciclo de detección de cambios y Angular
   * recrearía todas las tarjetas.
   */
  marqueeCategories: MarqueeCategory[] = this.skillCategories.map((category, index) => {
    const items = this.fillTrack(category.skills);
    return {
      ...category,
      items,
      durationSec: items.length * SECONDS_PER_ITEM,
      reverse: index % 2 === 1
    };
  });

  /** Los dos grupos idénticos que forman el bucle sin costuras. */
  readonly tracks = [0, 1];

  /** Repite la lista de skills hasta alcanzar MIN_TRACK_ITEMS tarjetas. */
  private fillTrack(skills: Skill[]): Skill[] {
    if (skills.length === 0) return [];

    const items: Skill[] = [];
    while (items.length < MIN_TRACK_ITEMS) {
      items.push(...skills);
    }
    return items;
  }
}
