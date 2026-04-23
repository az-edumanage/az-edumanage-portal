import { Injectable, inject, signal } from '@angular/core';
import { OwnerSettingsDataService } from '../data-access/owner-settings-data.service';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsSubscriptionCycle,
  OwnerSettingsTabId,
} from '../models/owner-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsStore {
  private readonly data = inject(OwnerSettingsDataService);

  readonly activeTab = signal<OwnerSettingsTabId>('general');
  readonly tabs = this.data.tabs;

  readonly subscriptionCycles = signal<OwnerSettingsSubscriptionCycle[]>(this.data.getSubscriptionCycles());
  readonly paymentMethods = signal<OwnerSettingsPaymentMethod[]>(this.data.getPaymentMethods());

  setActiveTab(tabId: OwnerSettingsTabId): void {
    this.activeTab.set(tabId);
  }

  addCycle(): void {
    this.subscriptionCycles.update((current) => {
      const newId = this.getNextId(current.map((cycle) => cycle.id));

      return [
        ...current,
        { id: newId, name: 'New Cycle', days: 30, icon: 'event', active: true },
      ];
    });
  }

  removeCycle(id: number): void {
    this.subscriptionCycles.update((current) => current.filter((cycle) => cycle.id !== id));
  }

  addPaymentMethod(): void {
    this.paymentMethods.update((current) => {
      const newId = this.getNextId(current.map((method) => method.id));

      return [
        ...current,
        {
          id: newId,
          name: 'New Method',
          description: 'Method description',
          icon: 'payment',
          active: true,
        },
      ];
    });
  }

  removePaymentMethod(id: number): void {
    this.paymentMethods.update((current) => current.filter((method) => method.id !== id));
  }

  savePresets(): void {
    this.data.savePresets(this.subscriptionCycles(), this.paymentMethods());
  }

  private getNextId(ids: number[]): number {
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}
