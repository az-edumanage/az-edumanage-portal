import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentExamCompletion } from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-exam-report',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <section class="page exam-attempt-page">
      @if (loading()) {
        <div class="state">Loading exam report...</div>
      } @else if (error()) {
        <div class="state error">
          {{ error() }}
          <a [routerLink]="backRoute()">Back to {{ backLabel() }}</a>
        </div>
      } @else if (report(); as reportData) {
        <header class="page-header report-page-header">
          <div>
            <h1>Exam Report</h1>
            <p>{{ subtitle() }}</p>
          </div>
          <a [routerLink]="backRoute()" class="button">
            <mat-icon>arrow_back</mat-icon>
            {{ backLabel() }}
          </a>
        </header>

        <section class="report-overview" aria-label="Exam score summary">
          <div class="report-score-hero">
            <div class="score-ring" [style.--score-percent]="scorePercent() + '%'">
              <strong>{{ formatNumber(reportData.score ?? 0) }}</strong>
              <span>/ {{ formatNumber(reportData.maxScore ?? totalQuestionWeight()) }}</span>
            </div>
            <div>
              <span class="summary-label">Total weight earned</span>
              <h2>{{ scorePercent() }}%</h2>
              <p>{{ correctCount() }} correct, {{ incorrectCount() }} incorrect</p>
            </div>
          </div>

          <dl class="report-meta-list">
            <div>
              <dt>Completed</dt>
              <dd>{{ timeFromInstant(reportData.completedAt) }}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{{ reportData.questions.length }}</dd>
            </div>
            <div>
              <dt>Total question weight</dt>
              <dd>{{ formatNumber(reportData.maxScore ?? totalQuestionWeight()) }}</dd>
            </div>
            <div>
              <dt>Missed weight</dt>
              <dd>{{ formatNumber(missedWeight()) }}</dd>
            </div>
          </dl>
        </section>

        @if (reportData.questions.length) {
          <nav class="question-strip" aria-label="Report questions">
            @for (item of reportData.questions; track item.questionId; let index = $index) {
              <a
                [attr.href]="'#question-' + item.questionId"
                [class.correct]="item.correct"
                [class.incorrect]="!item.correct"
                [attr.aria-label]="'Question ' + (index + 1) + ', ' + (item.correct ? 'correct' : 'incorrect')"
              >
                {{ index + 1 }}
              </a>
            }
          </nav>
        }

        <section class="exam-report standalone" aria-label="Question results">
          <div class="report-section-heading">
            <div>
              <span class="summary-label">Question review</span>
              <h2>Answers and feedback</h2>
            </div>
            <span>{{ formatNumber(reportData.score ?? 0) }} of {{ formatNumber(reportData.maxScore ?? totalQuestionWeight()) }} points</span>
          </div>

          @for (item of reportData.questions; track item.questionId; let index = $index) {
            <article
              class="report-question"
              [id]="'question-' + item.questionId"
              [class.correct]="item.correct"
              [class.incorrect]="!item.correct"
            >
              <div class="report-question-top">
                <div>
                  <span class="pill muted">Question {{ index + 1 }}</span>
                  <span class="question-type">{{ questionTypeLabel(item.type) }}</span>
                </div>
                <span class="result-status" [class.correct]="item.correct" [class.incorrect]="!item.correct">
                  <mat-icon>{{ item.correct ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ item.correct ? 'Correct' : 'Incorrect' }}
                </span>
              </div>

              <div class="report-question-body">
                <h3 dir="auto">{{ item.question }}</h3>
                <span class="question-score">{{ formatNumber(item.score) }} / {{ formatNumber(item.maxScore) }} points</span>
              </div>

              <dl class="report-answers">
                <div>
                  <dt>Your answer</dt>
                  <dd dir="auto" [class.muted-answer]="!item.studentAnswer">{{ item.studentAnswer || 'No answer submitted' }}</dd>
                </div>
                <div>
                  <dt>Correct answer</dt>
                  <dd dir="auto" [class.muted-answer]="!item.correctAnswer">{{ item.correctAnswer || 'Not configured' }}</dd>
                </div>
              </dl>

              @if (item.feedback) {
                <div class="report-feedback">
                  <span>Feedback</span>
                  <p dir="auto">{{ item.feedback }}</p>
                </div>
              }

              @if (item.matchedPoints.length || item.missingPoints.length) {
                <div class="report-points">
                  @if (item.matchedPoints.length) {
                    <div class="matched">
                      <strong><mat-icon>done</mat-icon>Matched points</strong>
                      <ul>
                        @for (point of item.matchedPoints; track point) {
                          <li dir="auto">{{ point }}</li>
                        }
                      </ul>
                    </div>
                  }
                  @if (item.missingPoints.length) {
                    <div class="missing">
                      <strong><mat-icon>remove</mat-icon>Missing points</strong>
                      <ul>
                        @for (point of item.missingPoints; track point) {
                          <li dir="auto">{{ point }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </article>
          } @empty {
            <div class="state">No question details were saved for this attempt.</div>
          }
        </section>
      }
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExamReportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(StudentDashboardDataService);

  readonly report = signal<StudentExamCompletion | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEvaluationRoute = computed(() => this.route.snapshot.data['source'] === 'evaluation');
  readonly isTeacherEvaluationRoute = computed(() => this.route.snapshot.data['source'] === 'teacherEvaluation');
  readonly isTenantEvaluationRoute = computed(() => this.route.snapshot.data['source'] === 'tenantEvaluation');
  readonly isTenantEvaluationGroupReportRoute = computed(() => this.route.snapshot.data['source'] === 'tenantEvaluationGroupReport');
  readonly isTenantHomeWorkEvaluationReportRoute = computed(() => this.route.snapshot.data['source'] === 'tenantHomeWorkEvaluationReport');
  readonly isParentEvaluationRoute = computed(() => this.route.snapshot.data['source'] === 'parentEvaluation');
  readonly backRoute = computed(() => {
    if (this.isTeacherEvaluationRoute()) return '/teacher/evaluation/exams';
    if (this.isTenantEvaluationRoute()) return '/tenant/exam-evaluation';
    if (this.isTenantEvaluationGroupReportRoute()) return ['/tenant/exam-evaluation', 'groups', this.route.snapshot.paramMap.get('groupId')];
    if (this.isTenantHomeWorkEvaluationReportRoute()) return '/tenant/evaluation/home-work';
    if (this.isParentEvaluationRoute()) return '/parent/exam-evaluation';
    return this.isEvaluationRoute() ? '/student/evaluation/exams' : '/student/exams';
  });
  readonly backLabel = computed(() => {
    if (this.isTeacherEvaluationRoute()) return 'Exams Evaluation';
    if (this.isTenantEvaluationRoute()) return 'Exams Evaluation';
    if (this.isTenantEvaluationGroupReportRoute()) return 'Group Exam Evaluation';
    if (this.isTenantHomeWorkEvaluationReportRoute()) return 'Home Work Evaluation';
    if (this.isParentEvaluationRoute()) return 'Exam Evaluation';
    return this.isEvaluationRoute() ? 'Exam Evaluation' : 'Exams';
  });
  readonly subtitle = computed(() => {
    if (this.isTeacherEvaluationRoute() || this.isTenantEvaluationRoute() || this.isTenantEvaluationGroupReportRoute() || this.isTenantHomeWorkEvaluationReportRoute() || this.isParentEvaluationRoute()) {
      return 'Saved evaluation report for this completed student attempt.';
    }
    return this.isEvaluationRoute() ? 'Saved report from Exam Evaluation.' : 'Submitted answers, scoring, and feedback for this attempt.';
  });
  readonly totalQuestionWeight = computed(() => this.report()?.questions.reduce((total, item) => total + item.maxScore, 0) ?? 0);
  readonly correctCount = computed(() => this.report()?.questions.filter((item) => item.correct).length ?? 0);
  readonly incorrectCount = computed(() => Math.max((this.report()?.questions.length ?? 0) - this.correctCount(), 0));
  readonly missedWeight = computed(() => {
    const report = this.report();
    if (!report) {
      return 0;
    }
    return Math.max((report.maxScore ?? this.totalQuestionWeight()) - (report.score ?? 0), 0);
  });
  readonly scorePercent = computed(() => {
    const report = this.report();
    const maxScore = report?.maxScore ?? this.totalQuestionWeight();
    if (!report || !maxScore) {
      return 0;
    }
    return Math.round(((report.score ?? 0) / maxScore) * 100);
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    const assignmentId = this.route.snapshot.paramMap.get('assignmentId');
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!groupId || !assignmentId || !attemptId) {
      this.error.set('Exam report route is invalid');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      this.report.set(await firstValueFrom(this.loadReport(groupId, assignmentId, attemptId)));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load exam report');
    } finally {
      this.loading.set(false);
    }
  }

  private loadReport(groupId: string, assignmentId: string, attemptId: string) {
    if (this.isTeacherEvaluationRoute()) {
      return this.data.teacherExamAttemptReport(groupId, assignmentId, attemptId);
    }
    if (this.isTenantEvaluationRoute() || this.isTenantEvaluationGroupReportRoute() || this.isTenantHomeWorkEvaluationReportRoute()) {
      return this.data.tenantExamAttemptReport(groupId, assignmentId, attemptId);
    }
    if (this.isParentEvaluationRoute()) {
      return this.data.parentExamAttemptReport(groupId, assignmentId, attemptId);
    }
    return this.data.examAttemptReport(groupId, assignmentId, attemptId);
  }

  timeFromInstant(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  questionTypeLabel(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
