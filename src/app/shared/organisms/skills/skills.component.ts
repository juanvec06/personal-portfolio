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
        { name: 'Python', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/2048px-Python-logo-notext.svg.png', iconType: 'src' },
        { name: 'Golang', icon: 'https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Aqua.svg' , iconType: 'src' },
        { name: 'Node.js', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png', iconType: 'src' },
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
}
