import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerProvisioningDataService } from '../data-access/owner-provisioning-data.service';
import { ProvisioningStatus } from '../models/owner-provisioning.models';
import { OwnerProvisioningStatusesDataService } from '../data-access/owner-provisioning-statuses-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningListStore {
  private readonly data = inject(OwnerProvisioningDataService);
  private readonly provisioningStatusesData = inject(OwnerProvisioningStatusesDataService);

  readonly filter = signal<'All' | ProvisioningStatus>('All');
  readonly jobs = this.data.jobs;
  readonly statusOptions = this.provisioningStatusesData.statusNames;

  readonly filteredJobs = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.jobs();
    }

    return this.jobs().filter((job) => job.status === currentFilter);
  });
}
