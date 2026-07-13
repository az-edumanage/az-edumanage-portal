import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../../student/data-access/student-dashboard-data.service';
import { StudentExamEvaluation } from '../../../student/models/student-dashboard.models';

@Component({
  selector: 'app-tenant-home-work-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './tenant-home-work-evaluation.component.html',
  styleUrl: '../tenant-exams-evaluation/tenant-exams-evaluation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantHomeWorkEvaluationComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);

  readonly evaluations = signal<StudentExamEvaluation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.evaluations();
    }
    return this.evaluations().filter((evaluation) => this.searchableText(evaluation).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize())));
  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredRows().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredRows().length, this.page() * this.pageSize()));
  readonly summary = computed(() => {
    const rows = this.evaluations();
    const studentsReviewed = new Set(rows.map((row) => row.studentId).filter((value): value is string => !!value)).size;
    const groupsReviewed = new Set(rows.map((row) => row.groupId).filter(Boolean)).size;
    return { completedReports: rows.length, studentsReviewed, groupsReviewed };
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.evaluations.set(await firstValueFrom(this.data.tenantHomeWorkEvaluations()));
      this.page.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load home work evaluation');
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

  reportRoute(evaluation: StudentExamEvaluation): unknown[] {
    return [
      '/tenant/evaluation/home-work/groups',
      evaluation.groupId,
      'exams',
      evaluation.assignmentId,
      'attempts',
      evaluation.attemptId,
      'report',
    ];
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
}
