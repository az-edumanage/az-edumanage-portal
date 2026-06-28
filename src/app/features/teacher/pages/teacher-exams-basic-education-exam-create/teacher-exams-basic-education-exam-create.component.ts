import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

type TeacherExamStatus = 'Draft' | 'Published' | 'Scheduled';

interface TeacherGradeExam {
  id: string;
  title: string;
  date: string;
  duration: number;
  status: TeacherExamStatus;
  questionCount: number;
  submissionCount: number;
}

function scopeText(gradeName: string, subjectName: string): string {
  return subjectName === 'All subjects' || subjectName === 'Subject'
    ? gradeName
    : `${gradeName}, ${subjectName}`;
}

@Component({
  selector: 'app-teacher-exams-basic-education-exam-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/teacher/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a routerLink="/teacher/exams/basic-education" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Basic Education</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="['/teacher/exams/basic-education', stageId()]" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ stageName() || 'Grades' }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="gradeSubjectsRoute()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ gradeName() }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-medium text-slate-600 dark:text-slate-300">{{ selectedSubjectLabel() }}</span>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        @if (isCreateMode()) {
          <a [routerLink]="listRoute()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Grade Exams</a>
          <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
          <span class="font-semibold text-slate-900 dark:text-slate-100">Create Exam</span>
        } @else {
          <span class="font-semibold text-slate-900 dark:text-slate-100">Grade Exams</span>
        }
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ isCreateMode() ? 'Create Exam' : gradeName() + ' Exams' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ sectionDescription() }}</p>
          </div>
          @if (hasExamScope()) {
            <div class="flex flex-wrap gap-2">
              @for (item of examMetadata(); track item.label) {
                <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <mat-icon class="text-base">{{ item.icon }}</mat-icon>
                  <span class="text-xs font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300/80">{{ item.label }}</span>
                  <span>{{ item.value }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load exam context</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading exam context</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while the assigned exam scope loads.</p>
          </div>
        } @else if (!hasExamScope()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Grade not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">This grade is not assigned to the current teacher.</p>
          </div>
        } @else if (isCreateMode()) {
          <form [formGroup]="examForm" class="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3" (ngSubmit)="onSubmit()">
            <div class="space-y-5 lg:col-span-2">
              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base">add_task</mat-icon>
                  Create Exam
                </h3>
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label class="md:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exam Title</span>
                    <input formControlName="title" type="text" placeholder="e.g. First Term Science Exam" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20">
                  </label>
                  <label>
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exam Date</span>
                    <input formControlName="date" type="date" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20">
                  </label>
                  <label>
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (Minutes)</span>
                    <input formControlName="duration" type="number" min="1" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20">
                  </label>
                  <label class="md:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions</span>
                    <textarea formControlName="instructions" rows="4" placeholder="Enter instructions for students..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20"></textarea>
                  </label>
                </div>
              </div>

              <div class="rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <mat-icon class="text-4xl text-slate-400">post_add</mat-icon>
                <h3 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">Questions will be added after exam setup</h3>
                <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Create the exam shell first, then attach questions from the question bank or manual entry flow.</p>
              </div>
            </div>

            <aside class="space-y-5">
              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Exam Scope</h3>
                <dl class="mt-4 space-y-3 text-sm">
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Stage</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ stageName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Grade</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ gradeName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Subject</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedSubjectLabel() }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Students</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ studentsCount() }}</dd>
                  </div>
                </dl>
              </div>

              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Settings</h3>
                <div class="mt-4 space-y-3">
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="shuffleQuestions" class="rounded border-slate-300 text-indigo-600">
                    <span>Shuffle questions</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="showResultsImmediately" class="rounded border-slate-300 text-indigo-600">
                    <span>Show results immediately</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="allowRetakes" class="rounded border-slate-300 text-indigo-600">
                    <span>Allow retakes</span>
                  </label>
                </div>
              </div>

              @if (submitMessage()) {
                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {{ submitMessage() }}
                </div>
              }

              <div class="flex flex-col gap-3">
                <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" [disabled]="examForm.invalid">
                  <mat-icon class="text-base">assignment</mat-icon>
                  Create Exam
                </button>
                <a [routerLink]="listRoute()" class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </a>
              </div>
            </aside>
          </form>
        } @else {
          <div class="space-y-6 p-5">
            <section class="rounded-lg border border-slate-200 dark:border-slate-800" aria-labelledby="grade-exams-heading">
              <div class="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 id="grade-exams-heading" class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                    <mat-icon class="text-lg text-indigo-600 dark:text-indigo-300">assignment</mat-icon>
                    Exams List
                  </h3>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ examsListDescription() }}</p>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="grid grid-cols-3 gap-2 text-center text-sm">
                    <div class="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                      <p class="font-bold text-slate-900 dark:text-slate-100">{{ exams().length }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    </div>
                    <div class="rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10">
                      <p class="font-bold text-emerald-700 dark:text-emerald-300">{{ publishedExamCount() }}</p>
                      <p class="text-xs text-emerald-700/80 dark:text-emerald-300/80">Published</p>
                    </div>
                    <div class="rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                      <p class="font-bold text-amber-700 dark:text-amber-300">{{ draftExamCount() }}</p>
                      <p class="text-xs text-amber-700/80 dark:text-amber-300/80">Drafts</p>
                    </div>
                  </div>
                  <a [routerLink]="createRoute()" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30">
                    <mat-icon class="text-base">add</mat-icon>
                    Create Exam
                  </a>
                </div>
              </div>

              @if (exams().length === 0) {
                <div class="px-5 py-10 text-center">
                  <mat-icon class="text-4xl text-slate-300 dark:text-slate-600">assignment_late</mat-icon>
                  <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">No exams created yet</h4>
                  <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Use Create Exam to prepare the first exam for this grade.</p>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      <tr>
                        <th class="px-5 py-3">Exam</th>
                        <th class="px-5 py-3">Date</th>
                        <th class="px-5 py-3">Duration</th>
                        <th class="px-5 py-3">Questions</th>
                        <th class="px-5 py-3">Submissions</th>
                        <th class="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (exam of exams(); track exam.id) {
                        <tr class="transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td class="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{{ exam.title }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.date }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.duration }} min</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.questionCount }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.submissionCount }}</td>
                          <td class="px-5 py-4">
                            <span class="inline-flex rounded-md px-2 py-1 text-xs font-bold" [class]="statusClass(exam.status)">{{ exam.status }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          </div>
        }
      </section>
    </div>
  `,
})
export class TeacherExamsBasicEducationExamCreateComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly stageId = signal(this.route.snapshot.paramMap.get('stageId') ?? '');
  readonly gradeId = signal(this.route.snapshot.paramMap.get('gradeId') ?? '');
  readonly subjectId = signal(this.route.snapshot.queryParamMap.get('subjectId') ?? '');
  readonly isCreateMode = signal(this.route.snapshot.data['mode'] === 'create');
  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly exams = signal<TeacherGradeExam[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitMessage = signal<string | null>(null);

  readonly gradeScopes = computed(() => this.scopes().filter((scope) =>
    isBasicScope(scope) && stageKey(scope) === this.stageId() && gradeKey(scope) === this.gradeId(),
  ));
  readonly selectedSubjectScope = computed(() => {
    const selectedId = this.subjectId();
    if (selectedId) {
      return this.gradeScopes().find((scope) => subjectKey(scope) === selectedId) ?? null;
    }

    return this.subjectCount() === 1 ? this.gradeScopes()[0] ?? null : null;
  });
  readonly stageName = computed(() => this.gradeScopes()[0]?.stage ?? '');
  readonly gradeName = computed(() => this.gradeScopes()[0]?.grade ?? 'Grade');
  readonly subjectCount = computed(() => uniqueCount(this.gradeScopes().map((scope) => subjectKey(scope))));
  readonly groupsCount = computed(() => this.gradeScopes().reduce((total, scope) => total + scope.groupsCount, 0));
  readonly studentsCount = computed(() => this.gradeScopes().reduce((total, scope) => total + scope.studentsCount, 0));
  readonly publishedExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Published').length);
  readonly draftExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Draft').length);
  readonly listRoute = computed(() => ['/teacher/exams/basic-education', this.stageId(), 'grades', this.gradeId(), 'create']);
  readonly createRoute = computed(() => [...this.listRoute(), 'new']);

  readonly examForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    date: ['', Validators.required],
    duration: [60, [Validators.required, Validators.min(1)]],
    instructions: [''],
    shuffleQuestions: [true],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  constructor() {
    this.loadSetup();
  }

  hasExamScope(): boolean {
    return this.gradeScopes().length > 0;
  }

  gradeSubjectsRoute(): string[] {
    return ['/teacher/exams/basic-education', this.stageId(), 'grades', this.gradeId()];
  }

  selectedSubjectLabel(): string {
    return this.selectedSubjectScope()?.subject || (this.subjectCount() > 1 ? 'All subjects' : 'Subject');
  }

  sectionDescription(): string {
    return this.isCreateMode()
      ? `Create a new exam for ${scopeText(this.gradeName(), this.selectedSubjectLabel())}.`
      : `Review existing exams for ${scopeText(this.gradeName(), this.selectedSubjectLabel())}.`;
  }

  examsListDescription(): string {
    return `${this.exams().length} exams prepared for ${scopeText(this.gradeName(), this.selectedSubjectLabel())}.`;
  }

  examMetadata(): { label: string; value: string; icon: string }[] {
    return [
      { label: 'Grade', value: this.gradeName(), icon: 'school' },
      { label: 'Subject', value: this.selectedSubjectLabel(), icon: 'menu_book' },
    ];
  }

  onSubmit(): void {
    this.submitMessage.set(null);
    if (this.examForm.invalid || !this.hasExamScope()) {
      this.examForm.markAllAsTouched();
      return;
    }

    const value = this.examForm.getRawValue();
    this.exams.update((exams) => [
      {
        id: `draft-${Date.now()}`,
        title: value.title,
        date: value.date,
        duration: value.duration,
        status: 'Draft',
        questionCount: 0,
        submissionCount: 0,
      },
      ...exams,
    ]);
    this.submitMessage.set(`Exam draft is ready for ${this.gradeName()}.`);
    this.examForm.reset({
      title: '',
      date: '',
      duration: 60,
      instructions: '',
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
    });
  }

  statusClass(status: TeacherExamStatus): string {
    const classes: Record<TeacherExamStatus, string> = {
      Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      Published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      Scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    };
    return classes[status];
  }

  private loadSetup(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.loadExamSetup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (scopes) => {
        this.scopes.set(scopes ?? []);
        this.exams.set(this.hasExamScope() ? this.buildInitialExams() : []);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.scopes.set([]);
        this.exams.set([]);
        this.loading.set(false);
        this.loadError.set(error.message || 'Unable to load assigned exam setup.');
      },
    });
  }

  private buildInitialExams(): TeacherGradeExam[] {
    const baseId = this.gradeId() || this.gradeName();
    return [
      {
        id: `${baseId}-term-one`,
        title: 'First Term Exam',
        date: '2026-06-24',
        duration: 90,
        status: 'Scheduled',
        questionCount: Math.max(this.subjectCount() * 20, 20),
        submissionCount: 0,
      },
      {
        id: `${baseId}-monthly-assessment`,
        title: 'Monthly Assessment',
        date: '2026-05-28',
        duration: 60,
        status: 'Published',
        questionCount: Math.max(this.subjectCount() * 12, 12),
        submissionCount: Math.min(this.studentsCount(), 18),
      },
    ];
  }
}

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter((value): value is string => !!value)).size;
}

function isBasicScope(scope: TeacherExamSetup): boolean {
  return scope.educationCategory === 'BASIC_EDUCATION';
}

function stageKey(scope: TeacherExamSetup): string {
  return scope.stageId || textKey(scope.stage) || scope.id;
}

function gradeKey(scope: TeacherExamSetup): string {
  return scope.gradeId || textKey(scope.grade) || scope.id;
}

function subjectKey(scope: TeacherExamSetup): string {
  return scope.subjectId || textKey(scope.subject) || scope.id;
}

function textKey(value: string | null | undefined): string {
  return (value ?? '').trim();
}
