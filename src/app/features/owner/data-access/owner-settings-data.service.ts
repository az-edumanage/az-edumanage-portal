import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { SubscriptionPresetService } from '../../../core/services/subscription-preset.service';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsSubscriptionCycle,
  OwnerSettingsTab,
} from '../models/owner-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsDataService {
  private readonly presetService = inject(SubscriptionPresetService);
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly tabs: OwnerSettingsTab[] = [
    { id: 'general', label: 'owner.settings.tab.general' },
    { id: 'subject', label: 'owner.settings.tab.subjectTemplate' },
    { id: 'presets', label: 'owner.settings.tab.presetsMethods' },
    { id: 'security', label: 'owner.settings.tab.security' },
    { id: 'roles', label: 'owner.settings.tab.roles' },
    { id: 'status', label: 'owner.settings.tab.status' },
    { id: 'modules-features', label: 'owner.settings.tab.modulesFeatures' },
    { id: 'billing', label: 'owner.settings.tab.billing' },
    { id: 'communication', label: 'owner.settings.tab.communication' },
    { id: 'storage', label: 'owner.settings.tab.storage' },
    { id: 'compliance', label: 'owner.settings.tab.auditCompliance' },
  ];

  getSubscriptionCycles(): OwnerSettingsSubscriptionCycle[] {
    return this.presetService.cycles().map((cycle) => ({ ...cycle }));
  }

  async fetchSubscriptionCycles(): Promise<OwnerSettingsSubscriptionCycle[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<Array<{
      id: number;
      name: string;
      days: number;
      icon: string;
      active: boolean;
    }>>(`${environment.apiBaseUrl}/platform-settings/subscription-cycles`));

    return (response ?? []).map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      days: cycle.days,
      icon: cycle.icon || 'event',
      active: cycle.active,
    }));
  }

  getPaymentMethods(): OwnerSettingsPaymentMethod[] {
    return this.presetService.paymentMethods().map((method) => ({ ...method }));
  }

  async saveSubscriptionCycles(cycles: OwnerSettingsSubscriptionCycle[]): Promise<OwnerSettingsSubscriptionCycle[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<Array<{
      id: number;
      name: string;
      days: number;
      icon: string;
      active: boolean;
    }>>(`${environment.apiBaseUrl}/platform-settings/subscription-cycles`, {
      cycles: cycles.map((cycle) => ({
        id: cycle.id > 0 ? cycle.id : null,
        name: cycle.name,
        days: cycle.days,
        icon: cycle.icon,
        active: cycle.active,
      })),
    }));

    return (response ?? []).map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      days: cycle.days,
      icon: cycle.icon || 'event',
      active: cycle.active,
    }));
  }

  savePresets(cycles: OwnerSettingsSubscriptionCycle[], methods: OwnerSettingsPaymentMethod[]): void {
    this.presetService.updateCycles(cycles.map((cycle) => ({ ...cycle })));
    this.presetService.updatePaymentMethods(methods.map((method) => ({ ...method })));
  }
}
