import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export type ProvisioningStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export interface ProvisioningJob {
  id: string;
  tenantName: string;
  plan: string;
  triggeredBy: 'System' | 'Admin';
  createdDate: string;
  status: ProvisioningStatus;
  duration: string;
}

@Component({
  selector: 'app-owner-provisioning-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-provisioning-list.component.html'})
export class OwnerProvisioningListComponent {
  filter = signal<'All' | ProvisioningStatus>('All');

  jobs = signal<ProvisioningJob[]>([
    {
      id: 'job-1023',
      tenantName: 'Sunrise Academy',
      plan: 'Enterprise',
      triggeredBy: 'System',
      createdDate: 'Feb 21, 2026 10:30 AM',
      status: 'In Progress',
      duration: '2m 15s'
    },
    {
      id: 'job-1022',
      tenantName: 'Cairo Math Center',
      plan: 'Professional',
      triggeredBy: 'Admin',
      createdDate: 'Feb 21, 2026 09:15 AM',
      status: 'Completed',
      duration: '4m 30s'
    },
    {
      id: 'job-1021',
      tenantName: 'Future Leaders',
      plan: 'Starter',
      triggeredBy: 'System',
      createdDate: 'Feb 20, 2026 04:45 PM',
      status: 'Failed',
      duration: '1m 10s'
    },
    {
      id: 'job-1020',
      tenantName: 'Elite Tutors',
      plan: 'Professional',
      triggeredBy: 'System',
      createdDate: 'Feb 20, 2026 02:00 PM',
      status: 'Completed',
      duration: '3m 45s'
    },
    {
      id: 'job-1019',
      tenantName: 'Bright Minds',
      plan: 'Starter',
      triggeredBy: 'Admin',
      createdDate: 'Feb 19, 2026 11:20 AM',
      status: 'Completed',
      duration: '3m 12s'
    }
  ]);

  filteredJobs = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.jobs();
    }
    return this.jobs().filter(j => j.status === currentFilter);
  });
}
