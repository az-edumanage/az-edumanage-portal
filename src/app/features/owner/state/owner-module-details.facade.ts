import { Injectable, inject } from '@angular/core';
import { OwnerModuleDetailsStore } from './owner-module-details.store';

@Injectable({ providedIn: 'root' })
export class OwnerModuleDetailsFacade {
  private readonly store = inject(OwnerModuleDetailsStore);

  readonly activeTab = this.store.activeTab;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;
  readonly module = this.store.module;
  readonly features = this.store.features;
  readonly limits = this.store.limits;
  readonly availablePlans = this.store.availablePlans;
  readonly overrides = this.store.overrides;
  readonly changeLogs = this.store.changeLogs;

  async loadModuleData(id: string): Promise<void> {
    await this.store.loadModuleData(id);
  }

  toggleStatus(): boolean {
    if (this.module().category !== 'Advanced') return false;

    const newStatus = this.module().status === 'Enabled' ? 'Disabled' : 'Enabled';

    if (newStatus === 'Disabled') {
      if (this.module().activeTenantsCount > 0) {
        const confirmed = confirm(
          `WARNING: This module is currently used by ${this.module().activeTenantsCount} active tenants. Disabling it will immediately revoke access. Are you sure?`
        );
        if (!confirmed) {
          return false;
        }
      }

    }

    this.module.update((moduleItem) => ({ ...moduleItem, status: newStatus }));
    return true;
  }
}
