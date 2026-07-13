import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { GroupAssessmentEvaluation } from '../../models/tenant-group-details.models';

@Component({
  selector: 'app-tenant-assessment-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './tenant-assessment-evaluation.component.html',
  styleUrl: '../tenant-exams-evaluation/tenant-exams-evaluation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantAssessmentEvaluationComponent implements OnInit {
  private readonly data = inject(TenantGroupDetailsDataService);

  readonly evaluations = signal<GroupAssessmentEvaluation[]>([]);
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
    const studentsReviewed = new Set(rows.map((row) => row.studentId).filter(Boolean)).size;
    const groupsReviewed = new Set(rows.map((row) => row.groupId).filter(Boolean)).size;
    const sessionsReviewed = new Set(rows.map((row) => `${row.groupId}:${row.sessionId}`).filter(Boolean)).size;
    return { completedAssessments: rows.length, studentsReviewed, groupsReviewed, sessionsReviewed };
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.evaluations.set(await firstValueFrom(this.data.loadAssessmentEvaluations()));
      this.page.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load assessment evaluation');
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

  assessmentRoute(evaluation: GroupAssessmentEvaluation): unknown[] {
    return [
      '/tenant/groups',
      evaluation.groupId,
      'sessions',
      evaluation.sessionId,
      'students',
      evaluation.studentId,
      'assessment',
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

  score(row: GroupAssessmentEvaluation): string {
    return `${this.formatNumber(row.studentGrade ?? 0)} / ${this.formatNumber(row.finalGrade ?? 0)}`;
  }

  scorePercent(row: GroupAssessmentEvaluation): number {
    const finalGrade = row.finalGrade ?? 0;
    if (!finalGrade) {
      return 0;
    }
    return Math.round(((row.studentGrade ?? 0) / finalGrade) * 100);
  }

  bloomSummary(row: GroupAssessmentEvaluation): string {
    if (!row.scores?.length) {
      return 'No Bloom scores';
    }
    return row.scores.map((score) => score.bloomName || 'Bloom level').join(', ');
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private searchableText(evaluation: GroupAssessmentEvaluation): string {
    return [
      evaluation.studentName,
      evaluation.groupName,
      evaluation.subjectName,
      evaluation.sessionDate,
      evaluation.sessionStartTime,
      this.instant(evaluation.updatedAt),
      this.score(evaluation),
      `${this.scorePercent(evaluation)}%`,
      this.bloomSummary(evaluation),
    ].filter(Boolean).join(' ').toLowerCase();
  }
}
