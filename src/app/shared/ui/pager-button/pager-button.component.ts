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
    const base =
      'px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50';
    return `${base} ${this.className()}`.trim();
  });
}
