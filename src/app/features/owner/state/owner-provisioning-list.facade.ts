import { Injectable, inject } from '@angular/core';
import { ProvisioningStatus } from '../models/owner-provisioning.models';
import { OwnerProvisioningListStore } from './owner-provisioning-list.store';
import { OwnerProvisioningStatusesDataService } from '../data-access/owner-provisioning-statuses-data.service';
import { OwnerProvisioningDataService } from '../data-access/owner-provisioning-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningListFacade {
  private readonly store = inject(OwnerProvisioningListStore);
  private readonly provisioningStatusesData = inject(OwnerProvisioningStatusesDataService);
  private readonly provisioningData = inject(OwnerProvisioningDataService);

  readonly filter = this.store.filter;
  readonly filteredJobs = this.store.filteredJobs;
  readonly statusOptions = this.store.statusOptions;
  readonly migrationStatuses = this.provisioningData.migrationStatuses;

  setFilter(value: 'All' | ProvisioningStatus): void {
    this.filter.set(value);
  }

  async refresh(): Promise<void> {
    await this.provisioningData.refresh();
  }

  async runTenantMigrations(): Promise<void> {
    await this.provisioningData.runTenantMigrations();
  }

  getStatusColor(status: string): string {
    return this.provisioningStatusesData.findByName(status)?.color ?? '#64748b';
  }
}
