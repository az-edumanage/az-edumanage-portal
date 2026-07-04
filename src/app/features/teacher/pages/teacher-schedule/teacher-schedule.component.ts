import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>My Schedule</h1>
          <p>Your weekly session schedule from assigned groups.</p>
        </div>
        <a class="button primary" routerLink="/teacher/schedule/calendar">
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
            <thead><tr><th>Group</th><th>Subject</th><th>Students</th><th>Room</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              @for (group of pagedGroups(); track group.id) {
                <tr class="schedule-row" [routerLink]="['/teacher/schedule/groups', group.id, 'sessions']" tabindex="0">
                  <td>{{ group.name }}<span>{{ group.schedule || 'Schedule not set' }}</span></td>
                  <td>{{ group.subject || '-' }}</td>
                  <td>{{ group.studentsCount }}</td>
                  <td>{{ formatRooms(group) }}</td>
                  <td><span class="pill">{{ group.status || 'Active' }}</span></td>
                  <td>
                    <span class="row-action">
                      Sessions
                      <mat-icon>chevron_right</mat-icon>
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    {{ searchTerm() ? 'No groups match your search.' : 'No assigned groups found.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filteredGroups().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredGroups().length }}</span>
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
  styleUrl: '../../../student/pages/student-shared.css',
  styles: [`
    .schedule-row {
      cursor: pointer;
      transition: background-color 160ms ease;
    }

    .schedule-row:hover,
    .schedule-row:focus-visible {
      background: #f8fafc;
      outline: none;
    }

    .row-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #4f46e5;
      font-size: 13px;
      font-weight: 900;
    }

    .row-action mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherScheduleComponent implements OnInit {
  private readonly data = inject(TeacherApiService);
  readonly groups = signal<TeacherAssignedGroup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly filteredGroups = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.groups();
    return this.groups().filter((group) => this.searchableText(group).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredGroups().length / this.pageSize())));
  readonly pagedGroups = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredGroups().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredGroups().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredGroups().length, this.page() * this.pageSize()));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.groups.set(await firstValueFrom(this.data.loadAssignedGroups()));
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

  formatRooms(group: TeacherAssignedGroup): string {
    const rooms = new Set<string>();
    if (group.room?.trim()) {
      rooms.add(group.room.trim());
    }
    Object.values(group.daySchedules ?? {}).forEach((schedule) => {
      const room = schedule.room?.trim();
      if (room) {
        rooms.add(room);
      }
    });
    return [...rooms].join(', ') || 'Not set';
  }

  private searchableText(group: TeacherAssignedGroup): string {
    return [
      group.name,
      group.schedule,
      group.subject,
      group.studentsCount,
      group.status,
      this.formatRooms(group),
    ].filter(Boolean).join(' ').toLowerCase();
  }
}
