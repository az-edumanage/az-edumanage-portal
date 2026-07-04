import { Injectable, inject } from '@angular/core';
import { TenantOverviewRange, TenantRevenueTrendRange } from '../models/tenant-overview.models';
import { TenantOverviewStore } from './tenant-overview.store';

@Injectable({ providedIn: 'root' })
export class TenantOverviewFacade {
  private readonly store = inject(TenantOverviewStore);

  readonly status = this.store.status;
  readonly range = this.store.range;
  readonly revenueTrendRange = this.store.revenueTrendRange;
  readonly data = this.store.data;
  readonly error = this.store.error;
  readonly isLoading = this.store.isLoading;
  readonly isUnavailable = this.store.isUnavailable;
  readonly kpis = this.store.kpis;
  readonly attendanceTrend = this.store.attendanceTrend;
  readonly revenueTrend = this.store.revenueTrend;
  readonly todaySessions = this.store.todaySessions;
  readonly runningGroups = this.store.runningGroups;
  readonly rooms = this.store.rooms;
  readonly pendingPayments = this.store.pendingPayments;
  readonly pendingPaymentCount = this.store.pendingPaymentCount;

  load(range?: TenantOverviewRange, revenueTrendRange?: TenantRevenueTrendRange): void {
    this.store.load(range, revenueTrendRange);
  }
}
