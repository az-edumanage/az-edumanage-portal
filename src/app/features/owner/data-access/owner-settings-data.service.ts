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
    { id: 'general', label: 'owner.settings.tab.general' },
    { id: 'subject', label: 'owner.settings.tab.subjectTemplate' },
    { id: 'presets', label: 'owner.settings.tab.presetsMethods' },
    { id: 'security', label: 'owner.settings.tab.security' },
    { id: 'billing', label: 'owner.settings.tab.billing' },
    { id: 'communication', label: 'owner.settings.tab.communication' },
    { id: 'storage', label: 'owner.settings.tab.storage' },
    { id: 'compliance', label: 'owner.settings.tab.auditCompliance' },
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
