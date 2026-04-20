import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerTenantDetailsStore {
  readonly showPlanDropdown = signal(false);
  readonly pendingPlanId = signal<string | null>(null);
  readonly isUpgrading = signal(false);

  setUpgrading(value: boolean): void {
    this.isUpgrading.set(value);
  }
}
