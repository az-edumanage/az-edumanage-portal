import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantScheduleDataService } from '../data-access/tenant-schedule-data.service';
import { ScheduleFilters } from '../models/tenant-schedule.models';

@Injectable({ providedIn: 'root' })
export class TenantScheduleStore {
  private readonly data = inject(TenantScheduleDataService);

  readonly filters = signal<ScheduleFilters>({
    teacher: '',
    room: '',
    day: '',
  });
  readonly sessions = this.data.sessions;

  readonly teachers = computed(() => [...new Set(this.sessions().map((session) => session.teacherName).filter(Boolean))]);
  readonly rooms = computed(() => [...new Set(this.sessions().map((session) => session.roomName).filter(Boolean))]);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filters();
    if (values.teacher) count++;
    if (values.room) count++;
    if (values.day) count++;
    return count;
  });

  readonly filteredSessions = computed(() => {
    const currentFilters = this.filters();
    return this.sessions().filter((session) => {
      const matchesTeacher = !currentFilters.teacher || session.teacherName === currentFilters.teacher;
      const matchesRoom = !currentFilters.room || session.roomName === currentFilters.room;
      const matchesDay = !currentFilters.day || session.day === currentFilters.day;
      return matchesTeacher && matchesRoom && matchesDay;
    });
  });

  loadSessions(): void {
    this.data.loadSessions().subscribe({ error: () => undefined });
  }
}
