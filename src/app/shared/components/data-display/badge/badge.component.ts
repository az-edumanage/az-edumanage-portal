import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  variant = input<'default' | 'success' | 'warning' | 'danger' | 'info'>('default');
  class = input<string>('');

  classes = computed(() => {
    const base = 'ds-badge';
    let variantClass = '';
    switch(this.variant()) {
      case 'success': variantClass = 'ds-badge--success'; break;
      case 'warning': variantClass = 'ds-badge--warning'; break;
      case 'danger': variantClass = 'ds-badge--danger'; break;
      case 'info': variantClass = 'ds-badge--info'; break;
      default: variantClass = 'ds-badge--default'; break;
    }
    return `${base} ${variantClass} ${this.class()}`;
  });
}
