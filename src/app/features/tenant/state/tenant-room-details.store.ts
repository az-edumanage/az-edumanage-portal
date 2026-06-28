import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantRoomDetailsDataService } from '../data-access/tenant-room-details-data.service';
import { RoomDetails, RoomSchedule } from '../models/tenant-room-details.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomDetailsStore {
  private readonly data = inject(TenantRoomDetailsDataService);

  readonly room = signal<RoomDetails | null>(null);
  readonly schedule = signal<RoomSchedule[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly totalOccupiedHours = computed(() => this.schedule().reduce((acc, curr) => acc + curr.durationHours, 0));
  readonly occupiedDaysCount = computed(() => new Set(this.schedule().map((item) => item.day)).size);
  readonly totalStudents = computed(() => {
    const studentsByGroup = new Map<string, number>();
    this.schedule().forEach((item) => {
      studentsByGroup.set(item.groupId, item.studentsCount);
    });
    return Array.from(studentsByGroup.values()).reduce((acc, count) => acc + count, 0);
  });
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
    const groupsCount = this.uniqueGroupsCount();
    if (groupsCount === 0) return 0;
    return Math.round(this.totalStudents() / groupsCount);
  });

  async loadRoom(id: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.schedule.set([]);

    try {
      const [room, schedule] = await Promise.all([
        this.data.getRoomById(id),
        this.data.getScheduleByRoomId(id),
      ]);
      this.room.set(room);
      this.schedule.set(schedule);
    } catch (error) {
      this.room.set(null);
      this.schedule.set([]);
      this.error.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
