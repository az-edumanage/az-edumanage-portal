import { Injectable, inject, signal } from '@angular/core';
import { OwnerUsageAnalyticsDataService } from '../data-access/owner-usage-analytics-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerUsageAnalyticsStore {
  private readonly data = inject(OwnerUsageAnalyticsDataService);

  readonly selectedDateRange = signal('30days');
  readonly modules = this.data.modules;
  readonly tenants = this.data.tenants;
}
