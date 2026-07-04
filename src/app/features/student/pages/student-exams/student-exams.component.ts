import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentExam } from '../../models/student-dashboard.models';

type ExamWindowStatus = 'notStarted' | 'inProgress' | 'ended';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header><h1>{{ title }}</h1><p>{{ subtitle }}</p></header>
      @if (loading()) { <div class="state">Loading {{ title.toLowerCase() }}...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        @if (actionError()) { <div class="state error">{{ actionError() }}</div> }
        @if (message()) { <div class="state">{{ message() }}</div> }
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input
                type="search"
                [placeholder]="'Search ' + title.toLowerCase()"
                [value]="searchTerm()"
                (input)="setSearchTerm($any($event.target).value)"
              />
            </label>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Group</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Availability</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (exam of pagedExams(); track exam.id) {
                <tr>
                  <td><strong>{{ exam.title }}</strong><span>{{ exam.instructions || 'No instructions' }}</span></td>
                  <td>{{ exam.groupName }}<span>{{ exam.subjectName || '-' }}</span></td>
                  <td>{{ date(exam.date) }}</td>
                  <td>{{ time(exam.startTime) }}</td>
                  <td>{{ exam.duration || 0 }} min</td>
                  <td>
                    <span
                      class="pill"
                      [class.warn]="windowStatus(exam) === 'notStarted'"
                      [class.info]="windowStatus(exam) === 'inProgress'"
                      [class.muted]="windowStatus(exam) === 'ended'"
                    >
                      {{ windowStatusLabel(exam) }}
                    </span>
                  </td>
                  <td><span class="pill">{{ exam.status }}</span></td>
                  <td>
                    <button
                      type="button"
                      class="action-button"
                      (click)="startExam(exam)"
                      [disabled]="windowStatus(exam) !== 'inProgress' || startingId() === exam.id"
                    >
                      <mat-icon>{{ startingId() === exam.id ? 'hourglass_top' : 'play_arrow' }}</mat-icon>
                      {{ startingId() === exam.id ? 'Starting' : 'Start' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty">
                    {{ searchTerm() ? 'No ' + title.toLowerCase() + ' match your search.' : 'No ' + title.toLowerCase() + ' assigned yet.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filteredExams().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredExams().length }}</span>
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
export class StudentExamsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(StudentDashboardDataService);
  readonly exams = signal<StudentExam[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly startingId = signal<string | null>(null);
  readonly filteredExams = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.exams();
    return this.exams().filter((exam) => this.searchableText(exam).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredExams().length / this.pageSize())));
  readonly pagedExams = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredExams().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredExams().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredExams().length, this.page() * this.pageSize()));

  get mode(): 'exams' | 'homeWork' {
    return this.route.snapshot.data['mode'] === 'homeWork' ? 'homeWork' : 'exams';
  }

  get title(): string { return this.mode === 'homeWork' ? 'Home Work' : 'Exams'; }
  get subtitle(): string { return this.mode === 'homeWork' ? 'Assigned work from your groups.' : 'Exams assigned by your teachers or the center.'; }

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set(null); this.actionError.set(null); this.message.set(null);
    try {
      this.exams.set(await firstValueFrom(this.mode === 'homeWork' ? this.data.homeWork() : this.data.exams()));
      this.page.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load exams');
    } finally {
      this.loading.set(false);
    }
  }

  setPageSize(value: string): void {
    const size = Number(value);
    this.pageSize.set(Number.isFinite(size) && size > 0 ? size : 10);
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

  async startExam(exam: StudentExam): Promise<void> {
    if (this.windowStatus(exam) !== 'inProgress' || this.startingId()) {
      return;
    }
    this.startingId.set(exam.id);
    this.message.set(null);
    this.actionError.set(null);
    try {
      const attempt = await firstValueFrom(this.data.startExamAttempt(exam.groupId, exam.id));
      await this.router.navigate(['/student/exams', exam.groupId, attempt.assignmentId, 'attempts', attempt.attemptId]);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Unable to start exam');
    } finally {
      this.startingId.set(null);
    }
  }

  windowStatus(exam: StudentExam): ExamWindowStatus {
    const start = this.examStart(exam);
    if (!start) return 'notStarted';
    const now = new Date();
    if (exam.startTime) {
      const end = new Date(start.getTime() + Math.max(1, exam.duration || 0) * 60_000);
      if (now < start) return 'notStarted';
      return now < end ? 'inProgress' : 'ended';
    }
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    if (now < dayStart) return 'notStarted';
    return now < dayEnd ? 'inProgress' : 'ended';
  }

  windowStatusLabel(exam: StudentExam): string {
    const status = this.windowStatus(exam);
    if (status === 'inProgress') return 'In progress';
    return status === 'ended' ? 'Ended' : 'Not started';
  }

  date(value: string | null | undefined): string {
    if (!value) return 'No date';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  time(value: string | null | undefined): string {
    if (!value) return 'Any time';
    const [h, m = '00'] = value.split(':');
    const hour = Number(h);
    if (Number.isNaN(hour)) return value;
    return `${hour % 12 || 12}:${m.padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  private examStart(exam: StudentExam): Date | null {
    if (!exam.date) return null;
    const time = exam.startTime || '00:00';
    const date = new Date(`${exam.date}T${time}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private searchableText(exam: StudentExam): string {
    return [
      exam.title,
      exam.instructions,
      exam.groupName,
      exam.subjectName,
      this.date(exam.date),
      this.time(exam.startTime),
      exam.duration ? `${exam.duration} min` : 'No duration',
      this.windowStatusLabel(exam),
      exam.status,
    ].filter(Boolean).join(' ').toLowerCase();
  }
}
