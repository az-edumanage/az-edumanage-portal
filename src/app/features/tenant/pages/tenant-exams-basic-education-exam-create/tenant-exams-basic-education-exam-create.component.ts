import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';

type BasicEducationExamStatus = 'Draft' | 'Published' | 'Scheduled';

interface BasicEducationGradeExam {
  id: string;
  title: string;
  date: string;
  duration: number;
  status: BasicEducationExamStatus;
  questionCount: number;
  submissionCount: number;
}

@Component({
  selector: 'app-tenant-exams-basic-education-exam-create',
  imports: [RouterModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/tenant/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a routerLink="/tenant/exams/basic-education" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Basic Education</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="['/tenant/exams/basic-education', stageId()]" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ selectedStage()?.name || 'Grades' }}</a>
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
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ isCreateMode() ? 'Create Exam' : (selectedGrade()?.name || 'Grade') + ' Exams' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ isCreateMode() ? 'Create a new exam for this grade.' : 'Review existing exams and create a new exam for this grade.' }}</p>
          </div>
          @if (selectedGrade()) {
            <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <mat-icon class="text-base">school</mat-icon>
              <span>{{ selectedGrade()?.name }}</span>
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
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while the grade and stage load.</p>
          </div>
        } @else if (!selectedStage() || !selectedGrade()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Grade not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected grade is not available for this education stage.</p>
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
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedStage()?.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Grade</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedGrade()?.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">Students</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedGrade()?.studentCount }}</dd>
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
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ exams().length }} exams prepared for {{ selectedGrade()?.name }}.</p>
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
export class TenantExamsBasicEducationExamCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);

  readonly stageId = signal('');
  readonly gradeId = signal('');
  readonly isCreateMode = signal(false);
  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly exams = signal<BasicEducationGradeExam[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitMessage = signal<string | null>(null);

  readonly selectedStage = computed(() => this.stages().find((stage) => stage.id === this.stageId()) ?? null);
  readonly selectedGrade = computed(() => this.grades().find((grade) => grade.id === this.gradeId() && grade.stageId === this.stageId()) ?? null);
  readonly publishedExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Published').length);
  readonly draftExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Draft').length);
  readonly listRoute = computed(() => ['/tenant/exams/basic-education', this.stageId(), 'grades', this.gradeId(), 'create']);
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

  ngOnInit(): void {
    this.stageId.set(this.route.snapshot.paramMap.get('stageId') ?? '');
    this.gradeId.set(this.route.snapshot.paramMap.get('gradeId') ?? '');
    this.isCreateMode.set(this.route.snapshot.data['mode'] === 'create');
    void this.loadContext();
  }

  onSubmit(): void {
    this.submitMessage.set(null);
    if (this.examForm.invalid || !this.selectedGrade()) {
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
    this.submitMessage.set(`Exam draft is ready for ${this.selectedGrade()?.name}.`);
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

  statusClass(status: BasicEducationExamStatus): string {
    const classes: Record<BasicEducationExamStatus, string> = {
      Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      Published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      Scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    };
    return classes[status];
  }

  private async loadContext(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [stages, grades] = await Promise.all([
        this.stagesData.listStages(),
        this.gradesData.listGrades(),
      ]);
      this.stages.set(stages);
      this.grades.set(grades);
      this.exams.set(this.buildInitialExams());
    } catch (error) {
      this.loadError.set(this.gradesData.toUserMessage(error));
      this.stages.set([]);
      this.grades.set([]);
      this.exams.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private buildInitialExams(): BasicEducationGradeExam[] {
    return [
      {
        id: `${this.gradeId()}-term-one`,
        title: 'First Term Exam',
        date: '2026-06-24',
        duration: 90,
        status: 'Scheduled',
        questionCount: 42,
        submissionCount: 0,
      },
      {
        id: `${this.gradeId()}-monthly-assessment`,
        title: 'Monthly Assessment',
        date: '2026-05-28',
        duration: 60,
        status: 'Published',
        questionCount: 25,
        submissionCount: Math.min(this.selectedGrade()?.studentCount ?? 0, 18),
      },
    ];
  }
}
