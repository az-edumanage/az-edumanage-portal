import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-security-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-security-tab.component.html',
  styleUrl: './owner-settings-security-tab.component.css',
})
export class OwnerSettingsSecurityTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
