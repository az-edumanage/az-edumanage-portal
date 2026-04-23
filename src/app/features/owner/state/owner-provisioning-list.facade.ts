import { Injectable, inject } from '@angular/core';
import { ProvisioningStatus } from '../models/owner-provisioning.models';
import { OwnerProvisioningListStore } from './owner-provisioning-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningListFacade {
  private readonly store = inject(OwnerProvisioningListStore);

  readonly filter = this.store.filter;
  readonly filteredJobs = this.store.filteredJobs;

  setFilter(value: 'All' | ProvisioningStatus): void {
    this.filter.set(value);
  }
}
