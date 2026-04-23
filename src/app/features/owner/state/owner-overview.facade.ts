import { Injectable, inject } from '@angular/core';
import { OwnerOverviewStore } from './owner-overview.store';

@Injectable({ providedIn: 'root' })
export class OwnerOverviewFacade {
  private readonly store = inject(OwnerOverviewStore);

  readonly timeRange = this.store.timeRange;
  readonly stats = this.store.stats;
  readonly plans = this.store.plans;
  readonly activities = this.store.activities;
  readonly services = this.store.services;
  readonly regions = this.store.regions;

  setTimeRange(value: '7d' | '30d' | '90d'): void {
    this.timeRange.set(value);
  }
}
