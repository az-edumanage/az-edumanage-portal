import { Injectable, inject } from '@angular/core';
import { ScheduleFilters, ScheduleSession } from '../models/tenant-schedule.models';
import { TenantScheduleStore } from './tenant-schedule.store';

@Injectable({ providedIn: 'root' })
export class TenantScheduleFacade {
  private readonly store = inject(TenantScheduleStore);

  readonly teachers = this.store.teachers;
  readonly rooms = this.store.rooms;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredSessions = this.store.filteredSessions;

  setFilters(value: ScheduleFilters): void {
    this.store.filters.set(value);
  }

  resetFilters(): void {
    this.store.filters.set({
      teacher: '',
      room: '',
      day: '',
    });
  }

  loadSessions(): void {
    this.store.loadSessions();
  }

  getSessionsFor(day: string, time: string): ScheduleSession[] {
    const slotStart = this.toMinutes(time);

    return this.filteredSessions().filter((session) => {
      const sessionStart = this.toMinutes(session.startTime);

      return session.day === day && Math.floor(sessionStart / 60) === Math.floor(slotStart / 60);
    });
  }

  private toMinutes(time: string): number {
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return 0;
    }

    return hour * 60 + minute;
  }
}
