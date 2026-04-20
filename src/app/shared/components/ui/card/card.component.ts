import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html'
})
export class CardComponent {
  class = input<string>('');
}
