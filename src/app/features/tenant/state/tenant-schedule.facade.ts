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

  getSessionsFor(day: string, time: string): ScheduleSession[] {
    return this.filteredSessions().filter((session) => session.day === day && session.startTime === time);
  }
}
