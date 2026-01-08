import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-button.component.html',
  styleUrl: './social-button.component.scss'
})
export class SocialButtonComponent {
  @Input() platform: 'linkedin' | 'github' = 'github';
  @Input() href: string = '#';
  @Input() size: number = 24;
}
