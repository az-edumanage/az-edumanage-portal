import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerProvisioningDataService } from '../data-access/owner-provisioning-data.service';
import { ProvisioningStatus } from '../models/owner-provisioning.models';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningListStore {
  private readonly data = inject(OwnerProvisioningDataService);

  readonly filter = signal<'All' | ProvisioningStatus>('All');
  readonly jobs = this.data.jobs;

  readonly filteredJobs = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.jobs();
    }

    return this.jobs().filter((job) => job.status === currentFilter);
  });
}
