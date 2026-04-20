import { Injectable, inject } from '@angular/core';
import { OwnerModuleDetailsStore } from './owner-module-details.store';

@Injectable({ providedIn: 'root' })
export class OwnerModuleDetailsFacade {
  private readonly store = inject(OwnerModuleDetailsStore);

  readonly activeTab = this.store.activeTab;
  readonly module = this.store.module;
  readonly features = this.store.features;
  readonly limits = this.store.limits;
  readonly availablePlans = this.store.availablePlans;
  readonly overrides = this.store.overrides;
  readonly dependencies = this.store.dependencies;
  readonly changeLogs = this.store.changeLogs;

  loadModuleData(id: string): void {
    this.store.loadModuleData(id);
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

      if (this.dependencies.requiredBy.length > 0) {
        alert(`Cannot disable module. It is required by: ${this.dependencies.requiredBy.join(', ')}`);
        return false;
      }
    }

    this.module.update((moduleItem) => ({ ...moduleItem, status: newStatus }));
    return true;
  }
}
