import { Component } from '@angular/core';
import { SocialButtonComponent } from '../../atoms/social-button/social-button.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SocialButtonComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
