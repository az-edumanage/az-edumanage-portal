import { Injectable, inject } from '@angular/core';
import { SubscriptionPresetService } from '../../../core/services/subscription-preset.service';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsSubscriptionCycle,
  OwnerSettingsTab,
} from '../models/owner-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsDataService {
  private readonly presetService = inject(SubscriptionPresetService);

  readonly tabs: OwnerSettingsTab[] = [
    { id: 'general', label: 'General' },
    { id: 'subject', label: 'Subject' },
    { id: 'presets', label: 'Presets & Methods' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
    { id: 'communication', label: 'Communication' },
    { id: 'storage', label: 'Storage' },
    { id: 'compliance', label: 'Audit & Compliance' },
  ];

  getSubscriptionCycles(): OwnerSettingsSubscriptionCycle[] {
    return this.presetService.cycles().map((cycle) => ({ ...cycle }));
  }

  getPaymentMethods(): OwnerSettingsPaymentMethod[] {
    return this.presetService.paymentMethods().map((method) => ({ ...method }));
  }

  savePresets(cycles: OwnerSettingsSubscriptionCycle[], methods: OwnerSettingsPaymentMethod[]): void {
    this.presetService.updateCycles(cycles.map((cycle) => ({ ...cycle })));
    this.presetService.updatePaymentMethods(methods.map((method) => ({ ...method })));
  }
}
