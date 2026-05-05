import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ProvisioningStatus } from '../../models/owner-provisioning.models';
import { OwnerProvisioningListFacade } from '../../state/owner-provisioning-list.facade';

@Component({
  selector: 'app-owner-provisioning-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-provisioning-list.component.html'})
export class OwnerProvisioningListComponent {
  private readonly facade = inject(OwnerProvisioningListFacade);

  readonly filter = this.facade.filter;
  readonly filteredJobs = this.facade.filteredJobs;
  readonly statusOptions = this.facade.statusOptions;

  setFilter(value: 'All' | ProvisioningStatus): void {
    this.facade.setFilter(value);
  }

  refresh(): void {
    void this.facade.refresh();
  }

  getStatusColor(status: string): string {
    return this.facade.getStatusColor(status);
  }
}
