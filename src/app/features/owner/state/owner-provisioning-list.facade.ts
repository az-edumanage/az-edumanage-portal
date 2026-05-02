import { Injectable, inject } from '@angular/core';
import { ProvisioningStatus } from '../models/owner-provisioning.models';
import { OwnerProvisioningListStore } from './owner-provisioning-list.store';
import { OwnerProvisioningStatusesDataService } from '../data-access/owner-provisioning-statuses-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningListFacade {
  private readonly store = inject(OwnerProvisioningListStore);
  private readonly provisioningStatusesData = inject(OwnerProvisioningStatusesDataService);

  readonly filter = this.store.filter;
  readonly filteredJobs = this.store.filteredJobs;
  readonly statusOptions = this.store.statusOptions;

  setFilter(value: 'All' | ProvisioningStatus): void {
    this.filter.set(value);
  }

  getStatusColor(status: string): string {
    return this.provisioningStatusesData.findByName(status)?.color ?? '#64748b';
  }
}
