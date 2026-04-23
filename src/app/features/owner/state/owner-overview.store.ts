import { Injectable, inject, signal } from '@angular/core';
import { OwnerOverviewDataService } from '../data-access/owner-overview-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerOverviewStore {
  private readonly data = inject(OwnerOverviewDataService);

  readonly timeRange = signal<'7d' | '30d' | '90d'>('30d');
  readonly stats = this.data.stats;
  readonly plans = this.data.plans;
  readonly activities = this.data.activities;
  readonly services = this.data.services;
  readonly regions = this.data.regions;
}
