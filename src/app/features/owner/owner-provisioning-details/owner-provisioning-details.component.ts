import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProvisioningStatus } from '../owner-provisioning-list/owner-provisioning-list.component';

interface ProvisioningStep {
  name: string;
  status: ProvisioningStatus;
  timestamp: string;
  details?: string;
  error?: string;
}

interface ProvisioningJobDetails {
  id: string;
  tenantName: string;
  tenantEmail: string;
  plan: string;
  triggeredBy: string;
  createdDate: string;
  status: ProvisioningStatus;
  duration: string;
  steps: ProvisioningStep[];
}

@Component({
  selector: 'app-owner-provisioning-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-provisioning-details.component.html'})
export class OwnerProvisioningDetailsComponent {
  private route = inject(ActivatedRoute);
  
  job = signal<ProvisioningJobDetails>({
    id: 'job-1023',
    tenantName: 'Sunrise Academy',
    tenantEmail: 'admin@sunrise.edu',
    plan: 'Enterprise',
    triggeredBy: 'System',
    createdDate: 'Feb 21, 2026 10:30 AM',
    status: 'In Progress',
    duration: '2m 15s',
    steps: [
      {
        name: 'Initialize Tenant Environment',
        status: 'Completed',
        timestamp: '10:30:05 AM',
        details: 'Created isolated database schema and storage bucket.'
      },
      {
        name: 'Provision Core Modules',
        status: 'Completed',
        timestamp: '10:30:45 AM',
        details: 'Deployed Academic Structure, Users, and Audit Log modules.'
      },
      {
        name: 'Activate Advanced Features',
        status: 'In Progress',
        timestamp: '10:31:15 AM',
        details: 'Configuring Exams & Grades module...'
      },
      {
        name: 'Configure Integrations',
        status: 'Pending',
        timestamp: '',
        details: 'Waiting for previous step.'
      },
      {
        name: 'Finalize Setup',
        status: 'Pending',
        timestamp: '',
        details: 'Send welcome email and generate admin credentials.'
      }
    ]
  });
}
