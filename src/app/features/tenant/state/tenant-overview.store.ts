import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TenantOverviewDataService } from '../data-access/tenant-overview-data.service';
import { RoomOccupancy, TenantOverviewRange, TenantOverviewState, TenantRevenueTrendRange } from '../models/tenant-overview.models';

const EMPTY_ROOM_OCCUPANCY: RoomOccupancy = {
  occupiedRooms: 0,
  freeRooms: 0,
  freeHours: '0h',
  freeHoursValue: 0,
  operatingWindow: '08:00 AM - 08:00 PM',
};

const INITIAL_STATE: TenantOverviewState = {
  status: 'idle',
  range: 'today',
  revenueTrendRange: 'month',
  data: null,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class TenantOverviewStore {
  private readonly dataService = inject(TenantOverviewDataService);
  private readonly state = signal<TenantOverviewState>(INITIAL_STATE);
  private loading = false;

  readonly status = computed(() => this.state().status);
  readonly range = computed(() => this.state().range);
  readonly revenueTrendRange = computed(() => this.state().revenueTrendRange);
  readonly data = computed(() => this.state().data);
  readonly error = computed(() => this.state().error);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly isUnavailable = computed(() => this.state().status === 'unavailable');
  readonly kpis = computed(() => this.state().data?.kpis ?? []);
  readonly attendanceTrend = computed(() => this.state().data?.attendanceTrend ?? { labels: [], datasets: [] });
  readonly revenueTrend = computed(() => this.state().data?.revenueTrend ?? { labels: [], datasets: [] });
  readonly todaySessions = computed(() => this.state().data?.todaySessions ?? []);
  readonly runningGroups = computed(() => this.state().data?.runningGroups ?? []);
  readonly rooms = computed(() => this.state().data?.rooms ?? EMPTY_ROOM_OCCUPANCY);
  readonly pendingPayments = computed(() => this.state().data?.pendingPayments ?? []);
  readonly pendingPaymentCount = computed(() => this.state().data?.pendingPaymentCount ?? 0);

  load(range: TenantOverviewRange = this.state().range, revenueTrendRange: TenantRevenueTrendRange = this.state().revenueTrendRange): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.state.update((state) => ({ ...state, status: 'loading', range, revenueTrendRange, error: null }));
    this.dataService
      .loadOverview(range, revenueTrendRange)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => this.state.set({ status: 'loaded', range: data.range, revenueTrendRange, data, error: null }),
        error: (error: Error) =>
          this.state.update((state) => ({
            ...state,
            status: 'unavailable',
            error: error.message || 'Unable to load overview data',
          })),
      });
  }
}
