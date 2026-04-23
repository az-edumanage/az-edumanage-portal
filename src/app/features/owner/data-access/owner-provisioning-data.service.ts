import { Injectable, signal } from '@angular/core';
import { ProvisioningJob } from '../models/owner-provisioning.models';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningDataService {
  readonly jobs = signal<ProvisioningJob[]>([
    {
      id: 'job-1023',
      tenantName: 'Sunrise Academy',
      plan: 'Enterprise',
      triggeredBy: 'System',
      createdDate: 'Feb 21, 2026 10:30 AM',
      status: 'In Progress',
      duration: '2m 15s',
    },
    {
      id: 'job-1022',
      tenantName: 'Cairo Math Center',
      plan: 'Professional',
      triggeredBy: 'Admin',
      createdDate: 'Feb 21, 2026 09:15 AM',
      status: 'Completed',
      duration: '4m 30s',
    },
    {
      id: 'job-1021',
      tenantName: 'Future Leaders',
      plan: 'Starter',
      triggeredBy: 'System',
      createdDate: 'Feb 20, 2026 04:45 PM',
      status: 'Failed',
      duration: '1m 10s',
    },
    {
      id: 'job-1020',
      tenantName: 'Elite Tutors',
      plan: 'Professional',
      triggeredBy: 'System',
      createdDate: 'Feb 20, 2026 02:00 PM',
      status: 'Completed',
      duration: '3m 45s',
    },
    {
      id: 'job-1019',
      tenantName: 'Bright Minds',
      plan: 'Starter',
      triggeredBy: 'Admin',
      createdDate: 'Feb 19, 2026 11:20 AM',
      status: 'Completed',
      duration: '3m 12s',
    },
  ]);
}
