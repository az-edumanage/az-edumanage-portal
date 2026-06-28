import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-exams-basic-education-subjects',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
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
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ gradeName() || 'Subjects' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ gradeName() || 'Grade Subjects' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Subjects assigned to this teacher for the selected grade.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">menu_book</mat-icon>
            <span>{{ subjects().length }} subjects</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center"><mat-icon class="text-3xl text-rose-500">error</mat-icon><p class="mt-3 text-sm text-slate-500">{{ loadError() }}</p></div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center"><mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon><h3 class="mt-3 text-base font-semibold text-slate-900">Loading subjects</h3></div>
        } @else if (subjects().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr><th class="px-5 py-3">Subject</th><th class="px-5 py-3">Stage</th><th class="px-5 py-3">Grade</th><th class="px-5 py-3 text-center">Groups</th><th class="px-5 py-3 text-center">Students</th><th class="px-5 py-3 text-right">Open</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (subject of subjects(); track subject.id) {
                  <tr class="group cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60" role="link" tabindex="0" (click)="openGradeExams(subject)" (keydown.enter)="openGradeExams(subject)" (keydown.space)="openGradeExams(subject); $event.preventDefault()">
                    <td class="px-5 py-4">
                      <a [routerLink]="examListRoute()" [queryParams]="subjectQueryParams(subject)" class="flex items-center gap-3" (click)="$event.stopPropagation()">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300"><mat-icon class="text-base">menu_book</mat-icon></span>
                        <span><span class="block font-semibold text-slate-900 dark:text-slate-100">{{ subject.subject }}</span><span class="block text-sm text-slate-500 dark:text-slate-400">{{ subject.status }}</span></span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ subject.stage }}</td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ subject.grade }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.groupsCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.studentsCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <a [routerLink]="examListRoute()" [queryParams]="subjectQueryParams(subject)" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="'Open exams for ' + subject.subject" (click)="$event.stopPropagation()">
                        <mat-icon class="text-base">chevron_right</mat-icon>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No subjects found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No assigned subjects are linked to this grade.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TeacherExamsBasicEducationSubjectsComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stageId = signal(this.route.snapshot.paramMap.get('stageId') ?? '');
  readonly gradeId = signal(this.route.snapshot.paramMap.get('gradeId') ?? '');
  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly subjects = computed(() => this.scopes()
    .filter((scope) => isBasicScope(scope) && stageKey(scope) === this.stageId() && gradeKey(scope) === this.gradeId())
    .sort((left, right) => left.subject.localeCompare(right.subject)));
  readonly stageName = computed(() => this.subjects()[0]?.stage ?? '');
  readonly gradeName = computed(() => this.subjects()[0]?.grade ?? '');

  constructor() {
    this.loadSetup();
  }

  examListRoute(): string[] {
    return ['/teacher/exams/basic-education', this.stageId(), 'grades', this.gradeId(), 'create'];
  }

  subjectQueryParams(subject: TeacherExamSetup): { subjectId: string } {
    return { subjectId: subjectKey(subject) };
  }

  openGradeExams(subject: TeacherExamSetup): void {
    void this.router.navigate(this.examListRoute(), { queryParams: this.subjectQueryParams(subject) });
  }

  private loadSetup(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.loadExamSetup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (scopes) => {
        this.scopes.set(scopes ?? []);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.scopes.set([]);
        this.loading.set(false);
        this.loadError.set(error.message || 'Unable to load assigned subjects.');
      },
    });
  }
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
