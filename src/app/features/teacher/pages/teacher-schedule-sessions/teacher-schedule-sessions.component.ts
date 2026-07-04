import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../../tenant/data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails } from '../../../tenant/models/tenant-group-details.models';

@Component({
  selector: 'app-teacher-schedule-sessions',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="teacher-attendance-page">
      <header class="page-header">
        <div>
          <h2>{{ group()?.name || 'Group sessions' }}</h2>
          <p>All scheduled sessions for this assigned group.</p>
        </div>

        <button type="button" class="refresh-button" routerLink="/teacher/schedule">
          <mat-icon>arrow_back</mat-icon>
          Schedule
        </button>
      </header>

      @if (errorMessage()) {
        <section class="alert-panel">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </section>
      }

      <section class="data-panel">
        <header class="panel-header">
          <div>
            <h3>Sessions</h3>
            <p>{{ sessions().length }} sessions</p>
          </div>
          <button type="button" class="refresh-button" (click)="loadGroup()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </header>

        @if (!loading() && sessions().length > 0) {
          <div class="panel-toolbar">
            <label class="search-control">
              <mat-icon>search</mat-icon>
              <input
                type="text"
                [value]="searchQuery()"
                (input)="setSearchQuery($event)"
                placeholder="Search sessions by date, day, time or room..."
              >
            </label>
          </div>
        }

        @if (loading()) {
          <div class="state-panel">
            <mat-icon>progress_activity</mat-icon>
            <h4>Loading sessions</h4>
          </div>
        } @else if (sessions().length === 0) {
          <div class="state-panel">
            <mat-icon>event_busy</mat-icon>
            <h4>No sessions</h4>
            <p>Scheduled sessions will appear here when the group has calendar events.</p>
          </div>
        } @else if (filteredSessions().length === 0) {
          <div class="state-panel">
            <mat-icon>search_off</mat-icon>
            <h4>No matching sessions</h4>
            <p>Try another date, day, time, or room.</p>
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (session of pagedSessions(); track session.id) {
                  <tr>
                    <td>
                      <strong>{{ session.day }}</strong>
                      <span>{{ formatSessionDate(session) }}</span>
                    </td>
                    <td>{{ formatSessionDate(session) }}</td>
                    <td>{{ formatTimeRange(session) }}</td>
                    <td>{{ session.room || group()?.room || 'Not set' }}</td>
                    <td><span class="status-chip" [class.status-active]="isUpcomingOrRunning(session)" [class.status-absent]="!isUpcomingOrRunning(session)">{{ sessionStatus(session) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <span>Showing {{ pageStart() }}-{{ pageEnd() }} of {{ filteredSessions().length }} sessions</span>
            <div>
              <label>
                Rows
                <select [value]="pageSize()" (change)="setPageSize($event)">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
              <button type="button" (click)="previousPage()" [disabled]="pageIndex() === 0" title="Previous page">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span>Page {{ pageIndex() + 1 }} of {{ totalPages() }}</span>
              <button type="button" (click)="nextPage()" [disabled]="pageIndex() + 1 >= totalPages()" title="Next page">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </footer>
        }
      </section>
    </div>
  `,
  styleUrl: '../teacher-attendance/teacher-attendance.component.css',
})
export class TeacherScheduleSessionsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupDetailsApi = inject(TenantGroupDetailsDataService);

  readonly groupId = signal(this.route.snapshot.paramMap.get('groupId') ?? '');
  readonly group = signal<GroupDetails | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly sessions = computed(() => (this.group()?.calendarEvents ?? [])
    .slice()
    .sort((left, right) => this.sessionDateTime(left).getTime() - this.sessionDateTime(right).getTime()));
  readonly filteredSessions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.sessions();
    }
    return this.sessions().filter((session) => [
      session.day,
      session.date,
      this.formatSessionDate(session),
      this.formatTimeRange(session),
      this.sessionStatus(session),
      session.room ?? '',
    ].some((value) => value.toLowerCase().includes(query)));
  });
  readonly totalPages = computed(() => Math.max(Math.ceil(this.filteredSessions().length / this.pageSize()), 1));
  readonly pageStart = computed(() => this.filteredSessions().length === 0 ? 0 : this.pageIndex() * this.pageSize() + 1);
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

  sessionStatus(session: GroupCalendarEvent): string {
    const now = Date.now();
    if (this.sessionDateTime(session, session.endTime).getTime() < now) {
      return 'Completed';
    }
    if (this.sessionDateTime(session).getTime() <= now) {
      return 'Running';
    }
    return 'Upcoming';
  }

  isUpcomingOrRunning(session: GroupCalendarEvent): boolean {
    return this.sessionStatus(session) !== 'Completed';
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
