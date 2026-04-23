import { Injectable, inject } from '@angular/core';
import { OwnerUsageAnalyticsStore } from './owner-usage-analytics.store';

@Injectable({ providedIn: 'root' })
export class OwnerUsageAnalyticsFacade {
  private readonly store = inject(OwnerUsageAnalyticsStore);

  readonly selectedDateRange = this.store.selectedDateRange;
  readonly modules = this.store.modules;
  readonly tenants = this.store.tenants;

  updateData(): void {
    console.log('Updating data for range:', this.selectedDateRange());
  }
}
