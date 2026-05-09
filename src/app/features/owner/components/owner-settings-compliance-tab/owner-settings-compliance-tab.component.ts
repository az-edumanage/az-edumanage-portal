import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-compliance-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-compliance-tab.component.html',
  styleUrl: './owner-settings-compliance-tab.component.css',
})
export class OwnerSettingsComplianceTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
