import { Injectable, inject } from '@angular/core';
import { TenantRoomDetailsStore } from './tenant-room-details.store';

@Injectable({ providedIn: 'root' })
export class TenantRoomDetailsFacade {
  private readonly store = inject(TenantRoomDetailsStore);

  readonly room = this.store.room;
  readonly schedule = this.store.schedule;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalOccupiedHours = this.store.totalOccupiedHours;
  readonly occupiedDaysCount = this.store.occupiedDaysCount;
  readonly totalStudents = this.store.totalStudents;
  readonly uniqueGroupsCount = this.store.uniqueGroupsCount;
  readonly freeDays = this.store.freeDays;
  readonly occupancyRate = this.store.occupancyRate;
  readonly avgGroupSize = this.store.avgGroupSize;

  loadRoom(id: string | null): Promise<void> {
    return this.store.loadRoom(id);
  }
}
