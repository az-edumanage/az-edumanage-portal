import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BadgeComponent, ButtonComponent, CardComponent } from '../../../shared/ui';
import { TABLE_COMPONENTS } from '../../../shared/directives';

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    ...TABLE_COMPONENTS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.component.html'})
export class DesignSystemShowcaseComponent {}
