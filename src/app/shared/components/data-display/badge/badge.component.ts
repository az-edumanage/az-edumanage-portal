import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  variant = input<'default' | 'success' | 'warning' | 'danger'>('default');
  class = input<string>('');

  classes = computed(() => {
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap';
    let variantClass = '';
    switch(this.variant()) {
      case 'success': variantClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; break;
      case 'warning': variantClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'; break;
      case 'danger': variantClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; break;
      default: variantClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'; break;
    }
    return `${base} ${variantClass} ${this.class()}`;
  });
}
