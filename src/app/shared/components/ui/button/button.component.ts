import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline'>('primary');
  size = input<'sm' | 'md' | 'lg' | 'icon'>('md');
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  class = input<string>('');

  classes = computed(() => {
    const base = 'ds-button';
    
    let variantClass = '';
    switch (this.variant()) {
      case 'primary': variantClass = 'ds-button--primary'; break;
      case 'secondary': variantClass = 'ds-button--secondary'; break;
      case 'ghost': variantClass = 'ds-button--ghost'; break;
      case 'danger':
      case 'destructive':
        variantClass = 'ds-button--danger';
        break;
      case 'outline': variantClass = 'ds-button--outline'; break;
    }

    let sizeClass = '';
    switch (this.size()) {
      case 'sm': sizeClass = 'ds-button--sm'; break;
      case 'md': sizeClass = 'ds-button--md'; break;
      case 'lg': sizeClass = 'ds-button--lg'; break;
      case 'icon': sizeClass = 'ds-button--icon'; break;
    }

    return `${base} ${variantClass} ${sizeClass} ${this.class()}`;
  });

  onClick(event: Event) {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
