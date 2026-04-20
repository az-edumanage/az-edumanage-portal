import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'>('primary');
  size = input<'sm' | 'md' | 'lg' | 'icon'>('md');
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  class = input<string>('');

  classes = computed(() => {
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    
    let variantClass = '';
    switch (this.variant()) {
      case 'primary': variantClass = 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'; break;
      case 'secondary': variantClass = 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'; break;
      case 'ghost': variantClass = 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'; break;
      case 'destructive': variantClass = 'bg-red-600 text-white hover:bg-red-700 shadow-sm'; break;
      case 'outline': variantClass = 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'; break;
    }

    let sizeClass = '';
    switch (this.size()) {
      case 'sm': sizeClass = 'h-8 px-3 text-xs'; break;
      case 'md': sizeClass = 'h-10 px-4 py-2 text-sm'; break;
      case 'lg': sizeClass = 'h-12 px-8 text-base'; break;
      case 'icon': sizeClass = 'h-10 w-10 flex items-center justify-center rounded-full sm:rounded-lg'; break;
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
