import { Component } from '@angular/core';
import { NavbarComponent } from './shared/organisms/navbar/navbar.component';
import { HomeComponent } from './shared/organisms/home/home.component';
import { ProjectsComponent } from './shared/organisms/projects/projects.component';
import { AboutMeComponent } from './shared/organisms/about-me/about-me.component';
import { SkillsComponent } from './shared/organisms/skills/skills.component';
import { FooterComponent } from './shared/organisms/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // Cause it's a single page application, we can import all the components here and use them in the template
  imports: [NavbarComponent, HomeComponent, ProjectsComponent, AboutMeComponent, SkillsComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portfolio2';
}
