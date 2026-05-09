import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsPresetsSaveStatus,
  OwnerSettingsSubscriptionCycle,
} from '../../models/owner-settings.models';

@Component({
  selector: 'app-owner-settings-presets-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-settings-presets-tab.component.html',
  styleUrl: './owner-settings-presets-tab.component.css',
})
export class OwnerSettingsPresetsTabComponent {
  readonly translate = input.required<(key: string) => string>();
  readonly subscriptionCycles = input.required<OwnerSettingsSubscriptionCycle[]>();
  readonly paymentMethods = input.required<OwnerSettingsPaymentMethod[]>();
  readonly isSaving = input(false);
  readonly saveStatus = input<OwnerSettingsPresetsSaveStatus | null>(null);

  readonly addCycle = output<void>();
  readonly removeCycle = output<number>();
  readonly addPaymentMethod = output<void>();
  readonly removePaymentMethod = output<number>();
  readonly savePresets = output<void>();
  readonly closeSaveStatus = output<void>();
}
