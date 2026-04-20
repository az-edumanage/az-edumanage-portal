const fs = require('fs');
const path = require('path');

function extractTemplate(tsPath, htmlPath, htmlContent) {
  const fullTsPath = path.join(process.cwd(), tsPath);
  const fullHtmlPath = path.join(process.cwd(), htmlPath);
  
  if (!fs.existsSync(fullTsPath)) return;
  
  // Write HTML
  fs.writeFileSync(fullHtmlPath, htmlContent.trim(), 'utf8');
  
  // Update TS
  let tsCode = fs.readFileSync(fullTsPath, 'utf8');
  tsCode = tsCode.replace(/template:\s*`[\s\S]*?`/m, `templateUrl: './${path.basename(htmlPath)}'`);
  fs.writeFileSync(fullTsPath, tsCode, 'utf8');
}

// 1. Button
extractTemplate(
  'src/app/shared/components/ui/button/button.component.ts',
  'src/app/shared/components/ui/button/button.component.html',
  `
<button
  [class]="classes()"
  [disabled]="disabled()"
  [type]="type()"
  (click)="onClick($event)"
>
  <ng-content></ng-content>
</button>
  `
);

// 2. Badge
extractTemplate(
  'src/app/shared/components/data-display/badge/badge.component.ts',
  'src/app/shared/components/data-display/badge/badge.component.html',
  `
<span [class]="classes()">
  <ng-content></ng-content>
</span>
  `
);

// 3. Card
extractTemplate(
  'src/app/shared/components/ui/card/card.component.ts',
  'src/app/shared/components/ui/card/card.component.html',
  `
<div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" [class]="class()">
  <ng-content></ng-content>
</div>
  `
);

console.log("Shared components templates extracted to .html files successfully.");
