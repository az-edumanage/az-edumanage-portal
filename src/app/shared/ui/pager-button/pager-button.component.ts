import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-pager-button',
  standalone: true,
  templateUrl: './pager-button.component.html',
})
export class UiPagerButtonComponent {
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  className = input<string>('');

  classes = computed(() => {
    const base = 'ds-pager-button';
    return `${base} ${this.className()}`.trim();
  });
}
