import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../../tenant/data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails } from '../../../tenant/models/tenant-group-details.models';

@Component({
  selector: 'app-teacher-attendance-sessions',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './teacher-attendance-sessions.component.html',
  styleUrl: '../teacher-attendance/teacher-attendance.component.css',
})
export class TeacherAttendanceSessionsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupDetailsApi = inject(TenantGroupDetailsDataService);

  readonly groupId = signal(this.route.snapshot.paramMap.get('groupId') ?? '');
  readonly group = signal<GroupDetails | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly completedSessions = computed(() => (this.group()?.calendarEvents ?? [])
    .filter((session) => this.isCompletedSession(session))
    .sort((left, right) => this.sessionDateTime(right).getTime() - this.sessionDateTime(left).getTime()));
  readonly filteredSessions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.completedSessions();
    }
    return this.completedSessions().filter((session) => [
      session.day,
      session.date,
      this.formatSessionDate(session),
      this.formatTimeRange(session),
      session.room ?? '',
      session.id,
    ].some((value) => value.toLowerCase().includes(query)));
  });
  readonly totalPages = computed(() => Math.max(Math.ceil(this.filteredSessions().length / this.pageSize()), 1));
  readonly pageStart = computed(() => {
    if (this.filteredSessions().length === 0) {
      return 0;
    }
    return this.pageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize(), this.filteredSessions().length));
  readonly pagedSessions = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredSessions().slice(start, start + this.pageSize());
  });

  constructor() {
    this.loadGroup();
  }

  loadGroup(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.groupDetailsApi.loadGroupById(this.groupId(), { scope: 'teacher' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (group) => this.group.set(group),
        error: (error: Error) => this.errorMessage.set(error.message || 'Unable to load group sessions'),
      });
  }

  setSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.pageIndex.set(0);
  }

  setPageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
    this.pageIndex.set(0);
  }

  previousPage(): void {
    this.pageIndex.update((page) => Math.max(page - 1, 0));
  }

  nextPage(): void {
    this.pageIndex.update((page) => Math.min(page + 1, this.totalPages() - 1));
  }

  formatSessionDate(session: GroupCalendarEvent): string {
    const date = new Date(`${session.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return session.date;
    }
    return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  formatTimeRange(session: GroupCalendarEvent): string {
    return `${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}`;
  }

  trackBySessionId(_: number, session: GroupCalendarEvent): string {
    return session.id;
  }

  private isCompletedSession(session: GroupCalendarEvent): boolean {
    return this.sessionDateTime(session, session.endTime).getTime() < Date.now();
  }

  private sessionDateTime(session: GroupCalendarEvent, time = session.startTime): Date {
    const safeTime = time?.trim() || '00:00';
    const date = new Date(`${session.date}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
    return new Date(`${session.date}T00:00:00`);
  }

  private formatTime(value: string | null | undefined): string {
    if (!value?.trim()) {
      return 'Not set';
    }
    const [hourPart, minutePart = '0'] = value.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return value;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  }
}
