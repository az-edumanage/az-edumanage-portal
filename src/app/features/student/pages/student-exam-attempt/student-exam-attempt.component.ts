import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import {
  StudentExamAttempt,
  StudentExamQuestion,
  StudentExamQuestionSubmission,
} from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-exam-attempt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <section class="page exam-attempt-page">
      @if (loading()) {
        <div class="state">Loading exam...</div>
      } @else if (error()) {
        <div class="state error">
          {{ error() }}
          <a routerLink="/student/exams">Back to exams</a>
        </div>
      } @else if (attempt(); as exam) {
        <header class="page-header">
          <div>
            <h1>{{ exam.title }}</h1>
            <p>{{ exam.groupName }}{{ exam.subjectName ? ' · ' + exam.subjectName : '' }}</p>
          </div>
          <a routerLink="/student/exams" class="button">
            <mat-icon>arrow_back</mat-icon>
            Exams
          </a>
        </header>

        <div class="exam-shell">
          <aside class="exam-summary">
            <div>
              <span class="summary-label">Progress</span>
              <strong>{{ currentQuestionNumber() }} / {{ exam.questions.length || 0 }}</strong>
            </div>
            <div>
              <span class="summary-label">Questions</span>
              <strong>{{ exam.questions.length }}</strong>
            </div>
            <div>
              <span class="summary-label">Answered</span>
              <strong>{{ answeredCount() }}</strong>
            </div>
            <div>
              <span class="summary-label">Time left</span>
              <strong [class.timer-danger]="remainingSeconds() <= 60">{{ countdownLabel() }}</strong>
            </div>
            <div>
              <span class="summary-label">Started</span>
              <strong>{{ timeFromInstant(exam.startedAt) }}</strong>
            </div>
            @if (exam.questions.length > 0) {
              <nav class="question-progress" aria-label="Exam questions">
                @for (question of exam.questions; track question.id; let index = $index) {
                  <button
                    type="button"
                    class="question-jump"
                    [class.active]="currentQuestionIndex() === index"
                    [class.answered]="hasAnswer(question)"
                    (click)="goToQuestion(index)"
                    [attr.aria-label]="'Question ' + (index + 1)"
                  >
                    {{ index + 1 }}
                  </button>
                }
              </nav>
            }
          </aside>

          <div class="exam-workspace">
            @if (exam.instructions) {
              <section class="exam-instructions">
                <strong>Instructions</strong>
                <p>{{ exam.instructions }}</p>
              </section>
            }

            @if (currentQuestion(); as question) {
              <article class="question-panel">
                <div class="question-head">
                  <span class="pill info">Question {{ currentQuestionNumber() }}</span>
                  @if (question.weight) {
                    <span class="question-weight">{{ question.weight }} points</span>
                  }
                </div>
                <h2>{{ question.question }}</h2>
                @if (question.description) {
                  <p class="question-description">{{ question.description }}</p>
                }
                @if (question.mediaUrl) {
                  <a [href]="question.mediaUrl" target="_blank" rel="noopener" class="media-link">
                    <mat-icon>attach_file</mat-icon>
                    {{ question.mediaOriginalName || 'Open attachment' }}
                  </a>
                }

                @if (isWrittenQuestion(question)) {
                  <label class="written-answer">
                    <span>Your answer</span>
                    <textarea
                      [rows]="writtenAnswerRows(question)"
                      [ngModel]="writtenAnswers()[question.id] || ''"
                      (ngModelChange)="writeAnswer(question.id, $event)"
                    ></textarea>
                  </label>
                } @else if (question.answers.length > 0) {
                  <div class="answer-list">
                    @for (answer of question.answers; track answer.id) {
                      <label class="answer-option">
                        <input
                          type="radio"
                          [name]="question.id"
                          [value]="answer.id"
                          [ngModel]="selectedAnswers()[question.id] || ''"
                          (ngModelChange)="selectAnswer(question.id, $event)"
                        />
                        <span>
                          <strong>{{ answer.answer }}</strong>
                          @if (answer.description) {
                            <small>{{ answer.description }}</small>
                          }
                        </span>
                      </label>
                    }
                  </div>
                } @else {
                  <label class="written-answer">
                    <span>Your answer</span>
                    <textarea
                      rows="5"
                      [ngModel]="writtenAnswers()[question.id] || ''"
                      (ngModelChange)="writeAnswer(question.id, $event)"
                    ></textarea>
                  </label>
                }
              </article>
            } @else {
              <div class="state">No questions are linked to this exam yet.</div>
            }

            @if (submitError()) {
              <div class="state error">{{ submitError() }}</div>
            }
            <div class="submit-bar">
              <span>{{ answeredCount() }} of {{ exam.questions.length }} answered</span>
              <div class="step-actions">
                <button type="button" class="button" (click)="previousQuestion()" [disabled]="currentQuestionIndex() === 0">
                  <mat-icon>chevron_left</mat-icon>
                  Previous
                </button>
                @if (isLastQuestion()) {
                  <button type="button" class="button primary" (click)="submit()" [disabled]="submitting() || exam.questions.length === 0">
                    <mat-icon>{{ submitting() ? 'hourglass_top' : 'check_circle' }}</mat-icon>
                    {{ submitting() ? 'Submitting' : 'Submit exam' }}
                  </button>
                } @else {
                  <button type="button" class="button primary" (click)="nextQuestion()">
                    Next
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExamAttemptComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(StudentDashboardDataService);

  readonly attempt = signal<StudentExamAttempt | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly remainingSeconds = signal(0);
  readonly currentQuestionIndex = signal(0);
  readonly selectedAnswers = signal<Record<string, string>>({});
  readonly writtenAnswers = signal<Record<string, string>>({});
  private timerId: ReturnType<typeof setInterval> | null = null;
  readonly currentQuestion = computed(() => {
    const exam = this.attempt();
    if (!exam || exam.questions.length === 0) return null;
    return exam.questions[Math.min(this.currentQuestionIndex(), exam.questions.length - 1)] ?? null;
  });
  readonly currentQuestionNumber = computed(() => (this.currentQuestion() ? this.currentQuestionIndex() + 1 : 0));
  readonly answeredCount = computed(() => {
    const exam = this.attempt();
    if (!exam) return 0;
    return exam.questions.filter((question) => this.hasAnswer(question)).length;
  });

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  async load(): Promise<void> {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    const assignmentId = this.route.snapshot.paramMap.get('assignmentId');
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!groupId || !assignmentId || !attemptId) {
      this.error.set('Exam route is invalid');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const attempt = await firstValueFrom(this.data.examAttempt(groupId, assignmentId, attemptId));
      this.attempt.set({
        ...attempt,
        questions: this.orderQuestionsForAttempt(attempt.questions),
      });
      this.currentQuestionIndex.set(0);
      this.startTimer();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load exam');
    } finally {
      this.loading.set(false);
    }
  }

  selectAnswer(questionId: string, answerId: string): void {
    this.selectedAnswers.update((answers) => ({ ...answers, [questionId]: answerId }));
  }

  writeAnswer(questionId: string, answer: string): void {
    this.writtenAnswers.update((answers) => ({ ...answers, [questionId]: answer }));
  }

  goToQuestion(index: number): void {
    const exam = this.attempt();
    if (!exam) return;
    const lastIndex = Math.max(exam.questions.length - 1, 0);
    this.currentQuestionIndex.set(Math.min(Math.max(index, 0), lastIndex));
  }

  previousQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() - 1);
  }

  nextQuestion(): void {
    this.goToQuestion(this.currentQuestionIndex() + 1);
  }

  isLastQuestion(): boolean {
    const exam = this.attempt();
    return !exam || this.currentQuestionIndex() >= exam.questions.length - 1;
  }

  isWrittenQuestion(question: StudentExamQuestion): boolean {
    const type = (question.type || '').trim().toUpperCase();
    return type === 'ESSAY' || type === 'SHORT_ANSWER';
  }

  writtenAnswerRows(question: StudentExamQuestion): number {
    return (question.type || '').trim().toUpperCase() === 'ESSAY' ? 8 : 3;
  }

  private orderQuestionsForAttempt(questions: StudentExamQuestion[]): StudentExamQuestion[] {
    return questions
      .map((question, index) => ({ question, index }))
      .sort((left, right) => {
        const priorityDiff = this.questionTypePriority(left.question) - this.questionTypePriority(right.question);
        return priorityDiff || left.index - right.index;
      })
      .map((item) => item.question);
  }

  private questionTypePriority(question: StudentExamQuestion): number {
    return this.isWrittenQuestion(question) ? 0 : 1;
  }

  async submit(): Promise<void> {
    await this.finishExam(false);
  }

  async finishExam(autoSubmitted: boolean): Promise<void> {
    const exam = this.attempt();
    if (!exam || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    try {
      await firstValueFrom(
        this.data.completeExamAttempt(exam.groupId, exam.assignmentId, exam.attemptId, this.submissions(exam)),
      );
      this.stopTimer();
      await this.router.navigate([
        '/student/evaluation/exams',
        exam.groupId,
        exam.assignmentId,
        'attempts',
        exam.attemptId,
        'report',
      ], { replaceUrl: autoSubmitted });
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Unable to submit exam');
    } finally {
      this.submitting.set(false);
    }
  }

  timeFromInstant(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  countdownLabel(): string {
    const total = Math.max(this.remainingSeconds(), 0);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  hasAnswer(question: StudentExamQuestion): boolean {
    if (!this.isWrittenQuestion(question) && question.answers.length > 0) {
      return Boolean(this.selectedAnswers()[question.id]);
    }
    return Boolean((this.writtenAnswers()[question.id] || '').trim());
  }

  private submissions(exam: StudentExamAttempt): StudentExamQuestionSubmission[] {
    return exam.questions.map((question) => {
      if (this.isWrittenQuestion(question) || question.answers.length === 0) {
        return {
          questionId: question.id,
          answer: this.writtenAnswers()[question.id] || '',
        };
      }
      return {
        questionId: question.id,
        answerId: this.selectedAnswers()[question.id] || null,
      };
    });
  }

  private startTimer(): void {
    this.stopTimer();
    const exam = this.attempt();
    if (!exam?.duration || exam.duration <= 0) {
      this.remainingSeconds.set(0);
      return;
    }
    this.updateRemainingSeconds();
    this.timerId = setInterval(() => {
      this.updateRemainingSeconds();
      if (this.remainingSeconds() <= 0) {
        this.stopTimer();
        void this.finishExam(true);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateRemainingSeconds(): void {
    const exam = this.attempt();
    if (!exam || !exam.duration || exam.duration <= 0) {
      this.remainingSeconds.set(0);
      return;
    }
    const startedAt = new Date(exam.startedAt).getTime();
    if (Number.isNaN(startedAt)) {
      this.remainingSeconds.set(0);
      return;
    }
    const endsAt = startedAt + exam.duration * 60_000;
    this.remainingSeconds.set(Math.max(Math.ceil((endsAt - Date.now()) / 1000), 0));
  }
}
