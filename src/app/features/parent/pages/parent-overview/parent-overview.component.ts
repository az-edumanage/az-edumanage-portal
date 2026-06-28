import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-parent-overview',
  standalone: true,
  template: `
    <section class="workspace-overview">
      <h1>Parent dashboard</h1>
    </section>
  `,
  styles: [`
    .workspace-overview { padding: 24px; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentOverviewComponent {}
