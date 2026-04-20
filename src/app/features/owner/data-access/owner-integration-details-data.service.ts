import { Injectable, inject } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { OwnerApiService } from './owner-api.service';
import {
  OwnerIntegrationConfigValue,
  OwnerIntegrationDetailsSeed,
  OwnerIntegrationHealthResult,
} from '../models/owner-integration-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationDetailsDataService {
  private readonly ownerApi = inject(OwnerApiService);

  getSeed(): OwnerIntegrationDetailsSeed {
    return {
      integration: {
        id: 'int-stripe',
        name: 'Stripe Payments',
        provider: 'Stripe',
        type: 'Payment',
        status: 'Connected',
        mode: 'Live',
        lastHealthCheck: '2 mins ago',
        icon: 'payments',
        description: 'Process credit card payments and manage subscriptions.',
      },
      logs: [
        {
          id: 'log-1',
          timestamp: 'Feb 21, 2026 11:30:05 AM',
          action: 'Health Check',
          status: 'Success',
          details: 'Connection verified successfully.',
        },
        {
          id: 'log-2',
          timestamp: 'Feb 21, 2026 11:25:00 AM',
          action: 'Configuration Update',
          status: 'Success',
          details: 'Updated webhook secret.',
        },
        {
          id: 'log-3',
          timestamp: 'Feb 20, 2026 04:15:22 PM',
          action: 'API Request',
          status: 'Error',
          details: 'Timeout connecting to provider.',
        },
        {
          id: 'log-4',
          timestamp: 'Feb 20, 2026 02:00:00 PM',
          action: 'Integration Enabled',
          status: 'Success',
          details: 'Switched from Test to Live mode.',
        },
      ],
    };
  }

  saveConfig(payload: OwnerIntegrationConfigValue): Observable<void> {
    void payload;
    return timer(500).pipe(map(() => void 0));
  }

  runHealthCheck(integrationId: string): Observable<OwnerIntegrationHealthResult> {
    return this.ownerApi
      .runIntegrationHealthCheck(integrationId)
      .pipe(map(({ result }) => result as OwnerIntegrationHealthResult));
  }
}
