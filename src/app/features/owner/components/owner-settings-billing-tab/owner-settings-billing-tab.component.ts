import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-billing-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-billing-tab.component.html',
  styleUrl: './owner-settings-billing-tab.component.css',
})
export class OwnerSettingsBillingTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
