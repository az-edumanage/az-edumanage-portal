import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-general-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-general-tab.component.html',
  styleUrl: './owner-settings-general-tab.component.css',
})
export class OwnerSettingsGeneralTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
