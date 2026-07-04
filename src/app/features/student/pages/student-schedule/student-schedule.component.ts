import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentScheduleSession } from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>My Schedule</h1>
          <p>Your weekly session schedule from enrolled groups.</p>
        </div>
        <a class="button primary" routerLink="/student/schedule/calendar">
          <mat-icon>calendar_month</mat-icon>
          Calendar
        </a>
      </header>
      @if (loading()) { <div class="state">Loading schedule...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input
                type="search"
                placeholder="Search schedule"
                [value]="searchTerm()"
                (input)="setSearchTerm($any($event.target).value)"
              />
            </label>
          </div>
          <table>
            <thead><tr><th>Day</th><th>Time</th><th>Group</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead>
            <tbody>
              @for (session of pagedSessions(); track session.id) {
                <tr>
                  <td>{{ session.day }}</td>
                  <td>{{ time(session.startTime) }}<span>{{ duration(session.duration) }}</span></td>
                  <td>{{ session.groupName }}</td>
                  <td>{{ session.subjectName || '-' }}</td>
                  <td>{{ session.teacherName || '-' }}</td>
                  <td>{{ session.roomName || '-' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    {{ searchTerm() ? 'No schedule sessions match your search.' : 'No schedule sessions found.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filteredSessions().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredSessions().length }}</span>
              <label>
                Rows
                <select [value]="pageSize()" (change)="setPageSize($any($event.target).value)">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </label>
              <button type="button" (click)="previousPage()" [disabled]="page() === 1" aria-label="Previous page">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <strong>Page {{ page() }} of {{ totalPages() }}</strong>
              <button type="button" (click)="nextPage()" [disabled]="page() === totalPages()" aria-label="Next page">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentScheduleComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);
  readonly sessions = signal<StudentScheduleSession[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly filteredSessions = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.sessions();
    return this.sessions().filter((session) => this.searchableText(session).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSessions().length / this.pageSize())));
  readonly pagedSessions = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredSessions().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredSessions().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredSessions().length, this.page() * this.pageSize()));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.sessions.set(await firstValueFrom(this.data.schedule()));
      this.page.set(1);
    }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load schedule'); }
    finally { this.loading.set(false); }
  }

  setPageSize(value: string): void {
    const size = Number(value);
    this.pageSize.set(Number.isNaN(size) ? 10 : size);
    this.page.set(1);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  previousPage(): void {
    this.page.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.page.update((page) => Math.min(this.totalPages(), page + 1));
  }

  time(value: string | null | undefined): string {
    if (!value) return 'No time';
    const [h, m = '00'] = value.split(':');
    const hour = Number(h);
    if (Number.isNaN(hour)) return value;
    return `${hour % 12 || 12}:${m.padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  duration(value: number | null | undefined): string {
    return value ? `${value} min` : 'Duration not set';
  }

  private searchableText(session: StudentScheduleSession): string {
    return [
      session.day,
      this.time(session.startTime),
      this.duration(session.duration),
      session.groupName,
      session.subjectName,
      session.teacherName,
      session.roomName,
    ].filter(Boolean).join(' ').toLowerCase();
  }
}
