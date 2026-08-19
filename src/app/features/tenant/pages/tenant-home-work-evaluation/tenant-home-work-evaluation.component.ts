import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { StudentDashboardDataService } from '../../../student/data-access/student-dashboard-data.service';
import { StudentExamEvaluation, StudentExamQuestionReport } from '../../../student/models/student-dashboard.models';

type CorrectionTab = 'auto' | 'manual';

interface ManualCorrectionRow {
  id: string;
  evaluation: StudentExamEvaluation;
  question: StudentExamQuestionReport;
}

@Component({
  selector: 'app-tenant-home-work-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './tenant-home-work-evaluation.component.html',
  styleUrl: '../tenant-exams-evaluation/tenant-exams-evaluation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantHomeWorkEvaluationComponent implements OnInit, OnDestroy {
  private readonly data = inject(StudentDashboardDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly evaluations = signal<StudentExamEvaluation[]>([]);
  readonly manualRows = signal<ManualCorrectionRow[]>([]);
  readonly loading = signal(false);
  readonly manualLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly manualError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly activeTab = signal<CorrectionTab>('auto');
  readonly selectedManualRowId = signal<string | null>(null);
  readonly manualScores = signal<Record<string, number>>({});
  readonly manualFeedback = signal<Record<string, string>>({});
  readonly savingManual = signal(false);
  readonly manualSaveMessage = signal<string | null>(null);
  readonly manualSaveError = signal<string | null>(null);
  readonly manualPreviewSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly manualPreviewLoading = signal(false);
  readonly manualPreviewError = signal<string | null>(null);
  private manualPreviewBlobUrl: string | null = null;
  private manualPreviewRequestId = 0;

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.evaluations();
    }
    return this.evaluations().filter((evaluation) => this.searchableText(evaluation).includes(query));
  });
  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });
  readonly filteredManualRows = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.manualRows();
    }
    return this.manualRows().filter((row) => this.manualSearchableText(row).includes(query));
  });
  readonly pagedManualRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredManualRows().slice(start, start + this.pageSize());
  });
  readonly activeRowsCount = computed(() => this.activeTab() === 'manual' ? this.filteredManualRows().length : this.filteredRows().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.activeRowsCount() / this.pageSize())));
  readonly rangeStart = computed(() => this.activeRowsCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.activeRowsCount(), this.page() * this.pageSize()));
  readonly selectedManualRow = computed(() => {
    const id = this.selectedManualRowId();
    return id ? this.manualRows().find((row) => row.id === id) ?? null : null;
  });
  readonly summary = computed(() => {
    const rows = this.evaluations();
    const studentsReviewed = new Set(rows.map((row) => row.studentId).filter((value): value is string => !!value)).size;
    const groupsReviewed = new Set(rows.map((row) => row.groupId).filter(Boolean)).size;
    return { completedReports: rows.length, studentsReviewed, groupsReviewed, manualAnswers: this.manualRows().length };
  });

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.revokeManualPreviewBlob();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.manualError.set(null);
    try {
      const evaluations = await firstValueFrom(this.data.tenantHomeWorkEvaluations());
      this.evaluations.set(evaluations);
      this.page.set(1);
      void this.loadManualRows(evaluations);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load home work evaluation');
    } finally {
      this.loading.set(false);
    }
  }

  async loadManualRows(evaluations = this.evaluations()): Promise<void> {
    this.manualLoading.set(true);
    this.manualError.set(null);
    try {
      const reports = await Promise.all(evaluations.map(async (evaluation) => {
        const report = await firstValueFrom(this.data.tenantExamAttemptReport(
          evaluation.groupId,
          evaluation.assignmentId,
          evaluation.attemptId,
        ));
        return { evaluation, report };
      }));
      const rows = reports.flatMap(({ evaluation, report }) =>
        report.questions
          .filter((question) => !!question.answerMediaUrl)
          .map((question) => ({
            id: `${evaluation.attemptId}:${question.questionId}`,
            evaluation,
            question,
          })),
      );
      this.manualRows.set(rows);
      this.manualScores.set(Object.fromEntries(rows.map((row) => [row.id, row.question.score ?? 0])));
      this.manualFeedback.set(Object.fromEntries(rows.map((row) => [row.id, row.question.feedback ?? ''])));
      if (!rows.some((row) => row.id === this.selectedManualRowId())) {
        this.selectedManualRowId.set(rows[0]?.id ?? null);
        if (rows[0]) {
          void this.loadManualPreview(rows[0]);
        }
      }
    } catch (error) {
      this.manualError.set(error instanceof Error ? error.message : 'Unable to load manual correction answers');
    } finally {
      this.manualLoading.set(false);
    }
  }

  setActiveTab(tab: CorrectionTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
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

  selectManualRow(row: ManualCorrectionRow): void {
    this.selectedManualRowId.set(row.id);
    this.manualSaveMessage.set(null);
    this.manualSaveError.set(null);
    void this.loadManualPreview(row);
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

  manualScore(row: ManualCorrectionRow): number {
    return this.manualScores()[row.id] ?? row.question.score ?? 0;
  }

  setManualScore(row: ManualCorrectionRow, value: string | number): void {
    const score = Number(value);
    this.manualScores.update((items) => ({
      ...items,
      [row.id]: Number.isFinite(score) ? score : 0,
    }));
  }

  setManualFeedback(row: ManualCorrectionRow, value: string): void {
    this.manualFeedback.update((items) => ({ ...items, [row.id]: value ?? '' }));
  }

  async saveManualCorrection(row: ManualCorrectionRow): Promise<void> {
    if (this.savingManual()) {
      return;
    }
    this.savingManual.set(true);
    this.manualSaveError.set(null);
    this.manualSaveMessage.set(null);
    try {
      const updated = await firstValueFrom(this.data.tenantEvaluateExamAttempt(
        row.evaluation.groupId,
        row.evaluation.assignmentId,
        row.evaluation.attemptId,
        [{
          questionId: row.question.questionId,
          score: this.manualScore(row),
          feedback: this.manualFeedback()[row.id] ?? row.question.feedback ?? '',
        }],
      ));
      const updatedQuestion = updated.questions.find((question) => question.questionId === row.question.questionId);
      if (updatedQuestion) {
        this.manualRows.update((rows) => rows.map((item) => item.id === row.id ? { ...item, question: updatedQuestion } : item));
        this.manualScores.update((items) => ({ ...items, [row.id]: updatedQuestion.score ?? 0 }));
        this.manualFeedback.update((items) => ({ ...items, [row.id]: updatedQuestion.feedback ?? '' }));
      }
      this.manualSaveMessage.set('Manual correction saved.');
    } catch (error) {
      this.manualSaveError.set(error instanceof Error ? error.message : 'Unable to save manual correction');
    } finally {
      this.savingManual.set(false);
    }
  }

  answerMediaUrl(row: ManualCorrectionRow): string {
    return this.mediaUrlToAbsolute(row.question.answerMediaUrl) ?? row.question.answerMediaUrl ?? '';
  }

  answerMediaKind(row: ManualCorrectionRow): 'image' | 'pdf' | 'file' {
    const type = (row.question.answerMediaContentType || '').toLowerCase();
    const name = `${row.question.answerMediaOriginalName || ''} ${row.question.answerMediaUrl || ''}`.toLowerCase();
    if (type.startsWith('image/') || /\.(apng|avif|gif|jpe?g|png|svg|webp)(\?|#|$)/.test(name)) {
      return 'image';
    }
    if (type === 'application/pdf' || /\.pdf(\?|#|$)/.test(name)) {
      return 'pdf';
    }
    return 'file';
  }

  questionScore(row: ManualCorrectionRow): string {
    return `${this.formatNumber(row.question.score ?? 0)} / ${this.formatNumber(row.question.maxScore ?? 0)}`;
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

  private manualSearchableText(row: ManualCorrectionRow): string {
    return [
      this.searchableText(row.evaluation),
      row.question.question,
      row.question.studentAnswer,
      row.question.answerMediaOriginalName,
      row.question.answerMediaContentType,
      this.questionScore(row),
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private async loadManualPreview(row: ManualCorrectionRow): Promise<void> {
    this.manualPreviewRequestId += 1;
    const requestId = this.manualPreviewRequestId;
    this.revokeManualPreviewBlob();
    this.manualPreviewSafeUrl.set(null);
    this.manualPreviewError.set(null);
    const url = this.answerMediaUrl(row);
    if (!url) {
      this.manualPreviewError.set('No answer file is attached.');
      return;
    }
    if (this.answerMediaKind(row) !== 'pdf') {
      this.manualPreviewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      return;
    }
    this.manualPreviewLoading.set(true);
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error();
      }
      const blob = await response.blob();
      if (requestId !== this.manualPreviewRequestId) {
        return;
      }
      this.manualPreviewBlobUrl = URL.createObjectURL(blob);
      this.manualPreviewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.manualPreviewBlobUrl));
    } catch {
      if (requestId === this.manualPreviewRequestId) {
        this.manualPreviewError.set('Unable to preview this answer file. Open it in a new tab.');
      }
    } finally {
      if (requestId === this.manualPreviewRequestId) {
        this.manualPreviewLoading.set(false);
      }
    }
  }

  private revokeManualPreviewBlob(): void {
    if (!this.manualPreviewBlobUrl) {
      return;
    }
    URL.revokeObjectURL(this.manualPreviewBlobUrl);
    this.manualPreviewBlobUrl = null;
  }

  private mediaUrlToAbsolute(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url) || url.startsWith('blob:')) {
      return url;
    }
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
