import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantRoomDetailsDataService } from '../data-access/tenant-room-details-data.service';
import { RoomDetails, RoomSchedule } from '../models/tenant-room-details.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomDetailsStore {
  private readonly data = inject(TenantRoomDetailsDataService);

  readonly room = signal<RoomDetails | null>(null);
  readonly schedule = signal<RoomSchedule[]>([]);

  readonly totalOccupiedHours = computed(() => this.schedule().reduce((acc, curr) => acc + curr.durationHours, 0));
  readonly occupiedDaysCount = computed(() => new Set(this.schedule().map((item) => item.day)).size);
  readonly totalStudents = computed(() => this.schedule().reduce((acc, curr) => acc + curr.studentsCount, 0));
  readonly uniqueGroupsCount = computed(() => new Set(this.schedule().map((item) => item.group)).size);

  readonly freeDays = computed(() => {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const occupied = new Set(this.schedule().map((item) => item.day));
    return allDays.filter((day) => !occupied.has(day));
  });

  readonly occupancyRate = computed(() => {
    const availableHours = 84;
    return Math.round((this.totalOccupiedHours() / availableHours) * 100);
  });

  readonly avgGroupSize = computed(() => {
    if (this.schedule().length === 0) return 0;
    return Math.round(this.totalStudents() / this.schedule().length);
  });

  loadRoom(id: string | null): void {
    this.room.set(this.data.getRoomById(id));
    this.schedule.set(this.data.getScheduleByRoomId());
  }
}
