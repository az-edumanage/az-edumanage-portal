import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Integration } from '../owner-integrations-list/owner-integrations-list.component';
import { OwnerApiService } from '../data-access/owner-api.service';

interface IntegrationLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'Success' | 'Error';
  details: string;
}

@Component({
  selector: 'app-owner-integration-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-integration-details.component.html'})
export class OwnerIntegrationDetailsComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private ownerApi = inject(OwnerApiService);
  
  activeTab = signal<'overview' | 'configuration' | 'health' | 'logs'>('overview');
  showSecret = false;
  isCheckingHealth = false;
  healthStatus: 'Unknown' | 'Healthy' | 'Unhealthy' = 'Unknown';
  lastHealthCheckResult = '';
  healthLog = '';

  integration = signal<Integration>({
    id: 'int-stripe',
    name: 'Stripe Payments',
    provider: 'Stripe',
    type: 'Payment',
    status: 'Connected',
    mode: 'Live',
    lastHealthCheck: '2 mins ago',
    icon: 'payments',
    description: 'Process credit card payments and manage subscriptions.'
  });

  configForm: FormGroup;

  logs: IntegrationLog[] = [
    { id: 'log-1', timestamp: 'Feb 21, 2026 11:30:05 AM', action: 'Health Check', status: 'Success', details: 'Connection verified successfully.' },
    { id: 'log-2', timestamp: 'Feb 21, 2026 11:25:00 AM', action: 'Configuration Update', status: 'Success', details: 'Updated webhook secret.' },
    { id: 'log-3', timestamp: 'Feb 20, 2026 04:15:22 PM', action: 'API Request', status: 'Error', details: 'Timeout connecting to provider.' },
    { id: 'log-4', timestamp: 'Feb 20, 2026 02:00:00 PM', action: 'Integration Enabled', status: 'Success', details: 'Switched from Test to Live mode.' }
  ];

  constructor() {
    this.configForm = this.fb.group({
      isLive: [true],
      apiKey: ['pk_live_51M...', Validators.required],
      secretKey: ['sk_live_51M...', Validators.required],
      webhookSecret: ['whsec_...']
    });
  }

  toggleStatus() {
    const newStatus = this.integration().status === 'Connected' ? 'Not Configured' : 'Connected';
    this.integration.update(i => ({ ...i, status: newStatus }));
  }

  saveConfig() {
    if (this.configForm.valid) {
      console.log('Saving config:', this.configForm.value);
      // Update integration mode based on form
      this.integration.update(i => ({ 
        ...i, 
        mode: this.configForm.get('isLive')?.value ? 'Live' : 'Test' 
      }));
      alert('Configuration saved successfully.');
    }
  }

  runHealthCheck() {
    this.isCheckingHealth = true;
    this.healthStatus = 'Unknown';
    this.healthLog = 'Initializing connection...\nAuthenticating with provider...\nSending test payload...';

    this.ownerApi.runIntegrationHealthCheck(this.integration().id).subscribe(({ result }) => {
      this.isCheckingHealth = false;
      this.healthStatus = result.healthStatus;
      this.lastHealthCheckResult = result.message;
      this.healthLog += result.log;
      this.integration.update((i) => ({ ...i, lastHealthCheck: result.lastHealthCheck }));
    });
  }
}
