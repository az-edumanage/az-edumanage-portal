import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentExamEvaluation } from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-exam-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <section class="page">
      <header>
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </header>

      @if (loading()) {
        <div class="state">Loading exam evaluations...</div>
      } @else if (error()) {
        <div class="state error">{{ error() }}</div>
      } @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input
                type="search"
                placeholder="Search evaluations"
                [value]="searchTerm()"
                (input)="setSearchTerm($any($event.target).value)"
              />
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>Exam</th>
                @if (showsStudentColumn()) {
                  <th>Student</th>
                }
                <th>Group</th>
                <th>Exam date</th>
                <th>Completed</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (evaluation of pagedEvaluations(); track evaluation.attemptId) {
                <tr>
                  <td>
                    <strong>{{ evaluation.title }}</strong>
                    <span>{{ evaluation.duration || 0 }} min</span>
                  </td>
                  @if (showsStudentColumn()) {
                    <td>
                      <strong>{{ evaluation.studentName || '-' }}</strong>
                      <span>{{ evaluation.studentId || '' }}</span>
                    </td>
                  }
                  <td>
                    {{ evaluation.groupName }}
                    <span>{{ evaluation.subjectName || '-' }}</span>
                  </td>
                  <td>
                    {{ date(evaluation.date) }}
                    <span>{{ time(evaluation.startTime) }}</span>
                  </td>
                  <td>
                    {{ instant(evaluation.completedAt) }}
                    <span>Started {{ instant(evaluation.startedAt) }}</span>
                  </td>
                  <td>
                    <strong>{{ score(evaluation) }}</strong>
                    <span>{{ scorePercent(evaluation) }}%</span>
                  </td>
                  <td><span class="pill info">{{ statusLabel(evaluation.status) }}</span></td>
                  <td>
                    <a
                      class="action-button"
                      [routerLink]="reportRoute(evaluation)"
                    >
                      <mat-icon>visibility</mat-icon>
                      Review
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="showsStudentColumn() ? 8 : 7" class="empty">
                    {{ searchTerm() ? 'No completed exams match your search.' : 'No completed exam reports yet.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredEvaluations().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredEvaluations().length }}</span>
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
export class StudentExamEvaluationComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);
  private readonly route = inject(ActivatedRoute);

  readonly evaluations = signal<StudentExamEvaluation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly source = computed(() => this.route.snapshot.data['source'] as string | undefined);
  readonly groupId = computed(() => this.route.snapshot.paramMap.get('groupId'));
  readonly showsStudentColumn = computed(() => this.source() === 'teacher' || this.source() === 'tenant' || this.source() === 'tenantEvaluationGroup' || this.source() === 'parent');
  readonly title = computed(() => this.source() === 'tenant' || this.source() === 'teacher' || this.source() === 'student' ? 'Exams Evaluation' : this.source() === 'tenantEvaluationGroup' ? 'Group Exam Evaluation' : 'Exam Evaluation');
  readonly subtitle = computed(() => {
    if (this.source() === 'teacher') return 'Completed student exam reports from your assigned groups.';
    if (this.source() === 'tenant') return 'Completed exam reports across all groups.';
    if (this.source() === 'student') return 'Saved exam reports from completed attempts.';
    if (this.source() === 'tenantEvaluationGroup') return 'Completed exam reports for the selected group.';
    if (this.source() === 'parent') return 'Completed exam reports for your linked students.';
    return 'Saved exam reports from completed attempts.';
  });

  readonly filteredEvaluations = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.evaluations();
    }
    return this.evaluations().filter((evaluation) => this.searchableText(evaluation).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredEvaluations().length / this.pageSize())));
  readonly pagedEvaluations = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredEvaluations().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredEvaluations().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredEvaluations().length, this.page() * this.pageSize()));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.evaluations.set(await firstValueFrom(this.loadEvaluations()));
      this.page.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load exam evaluations');
    } finally {
      this.loading.set(false);
    }
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  setPageSize(value: string): void {
    const size = Number(value);
    this.pageSize.set(Number.isFinite(size) && size > 0 ? size : 10);
    this.page.set(1);
  }

  previousPage(): void {
    this.page.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.page.update((page) => Math.min(this.totalPages(), page + 1));
  }

  date(value: string | null | undefined): string {
    if (!value) {
      return 'No date';
    }
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  time(value: string | null | undefined): string {
    if (!value) {
      return 'Any time';
    }
    const [h, m = '00'] = value.split(':');
    const hour = Number(h);
    if (Number.isNaN(hour)) {
      return value;
    }
    return `${hour % 12 || 12}:${m.padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  instant(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  score(evaluation: StudentExamEvaluation): string {
    return `${this.formatNumber(evaluation.score ?? 0)} / ${this.formatNumber(evaluation.maxScore ?? 0)}`;
  }

  scorePercent(evaluation: StudentExamEvaluation): number {
    const maxScore = evaluation.maxScore ?? 0;
    if (!maxScore) {
      return 0;
    }
    return Math.round(((evaluation.score ?? 0) / maxScore) * 100);
  }

  statusLabel(value: string): string {
    return (value || 'Completed').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  reportRoute(evaluation: StudentExamEvaluation): unknown[] {
    if (this.source() === 'teacher') {
      return ['/teacher/evaluation/exams', 'groups', evaluation.groupId, 'exams', evaluation.assignmentId, 'attempts', evaluation.attemptId, 'report'];
    }
    if (this.source() === 'tenant') {
      return ['/tenant/exam-evaluation', 'groups', evaluation.groupId, 'exams', evaluation.assignmentId, 'attempts', evaluation.attemptId, 'report'];
    }
    if (this.source() === 'tenantEvaluationGroup') {
      return ['/tenant/exam-evaluation', 'groups', evaluation.groupId, 'exams', evaluation.assignmentId, 'attempts', evaluation.attemptId, 'report'];
    }
    if (this.source() === 'parent') {
      return ['/parent/exam-evaluation', 'groups', evaluation.groupId, 'exams', evaluation.assignmentId, 'attempts', evaluation.attemptId, 'report'];
    }
    return ['/student/evaluation/exams', evaluation.groupId, evaluation.assignmentId, 'attempts', evaluation.attemptId, 'report'];
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private searchableText(evaluation: StudentExamEvaluation): string {
    return [
      evaluation.title,
      evaluation.studentName,
      evaluation.groupName,
      evaluation.subjectName,
      this.date(evaluation.date),
      this.time(evaluation.startTime),
      this.instant(evaluation.completedAt),
      this.score(evaluation),
      `${this.scorePercent(evaluation)}%`,
      this.statusLabel(evaluation.status),
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private loadEvaluations() {
    if (this.source() === 'teacher') {
      return this.data.teacherExamEvaluations();
    }
    if (this.source() === 'tenant') {
      return this.data.tenantExamEvaluations();
    }
    if (this.source() === 'tenantEvaluationGroup') {
      const groupId = this.groupId();
      if (!groupId) {
        throw new Error('Group is required');
      }
      return this.data.tenantGroupExamEvaluations(groupId);
    }
    if (this.source() === 'parent') {
      return this.data.parentExamEvaluations();
    }
    return this.data.examEvaluations();
  }
}
