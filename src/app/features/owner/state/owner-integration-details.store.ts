import { Injectable, signal } from '@angular/core';
import { Integration } from '../models/owner-integrations.models';
import {
  OwnerIntegrationDetailsTab,
  OwnerIntegrationHealthStatus,
  OwnerIntegrationLog,
} from '../models/owner-integration-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationDetailsStore {
  readonly activeTab = signal<OwnerIntegrationDetailsTab>('overview');
  readonly showSecret = signal(false);
  readonly isCheckingHealth = signal(false);
  readonly healthStatus = signal<OwnerIntegrationHealthStatus>('Unknown');
  readonly lastHealthCheckResult = signal('');
  readonly healthLog = signal('');

  readonly integration = signal<Integration>({
    id: 'int-placeholder',
    name: 'Integration',
    provider: 'Provider',
    type: 'Payment',
    status: 'Not Configured',
    mode: 'Test',
    lastHealthCheck: 'N/A',
    icon: 'extension',
    description: '',
  });

  readonly logs = signal<OwnerIntegrationLog[]>([]);

  setShowSecret(value: boolean): void {
    this.showSecret.set(value);
  }

  setCheckingHealth(value: boolean): void {
    this.isCheckingHealth.set(value);
  }

  setHealthStatus(status: OwnerIntegrationHealthStatus): void {
    this.healthStatus.set(status);
  }

  setHealthResult(message: string): void {
    this.lastHealthCheckResult.set(message);
  }

  setHealthLog(log: string): void {
    this.healthLog.set(log);
  }
}
