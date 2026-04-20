const fs = require('fs');
const path = require('path');

const files = {
  'src/app/shared/components/ui/button/button.component.ts': `import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: \`
    <button
      [class]="classes()"
      [disabled]="disabled()"
      [type]="type()"
      (click)="onClick($event)"
    >
      <ng-content></ng-content>
    </button>
  \`
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

    return \`\${base} \${variantClass} \${sizeClass} \${this.class()}\`;
  });

  onClick(event: Event) {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
`,
  'src/app/shared/components/data-display/badge/badge.component.ts': `import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: \`
    <span [class]="classes()">
      <ng-content></ng-content>
    </span>
  \`
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
    return \`\${base} \${variantClass} \${this.class()}\`;
  });
}
`,
  'src/app/shared/components/ui/card/card.component.ts': `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: \`
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" [class]="class()">
      <ng-content></ng-content>
    </div>
  \`
})
export class CardComponent {
  class = input<string>('');
}
`,
  'src/app/shared/directives/index.ts': '// Export useful directives here\n',
  'src/app/shared/pipes/index.ts': '// Export custom pipes here\n',
  'src/app/shared/validators/index.ts': '// Export custom form validators here\n',
  'src/app/shared/types/index.ts': '// Export globally shared TS interfaces/types here\n',
  'src/app/shared/utils/index.ts': '// Export utility functions (e.g., date formatters) here\n',
  'src/app/shared/components/feedback/index.ts': '// Root for feedback components (Toasts, Spinners, Modals)\n',
  'src/app/shared/components/form/index.ts': '// Root for form inputs and controls\n'
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Shared structure created successfully.");
