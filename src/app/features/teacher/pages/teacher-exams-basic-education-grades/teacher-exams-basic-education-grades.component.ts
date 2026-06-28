import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

interface TeacherGradeRow {
  id: string;
  name: string;
  stage: string;
  subjectCount: number;
  groupsCount: number;
  studentsCount: number;
}

@Component({
  selector: 'app-teacher-exams-basic-education-grades',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/teacher/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a routerLink="/teacher/exams/basic-education" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Basic Education</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ stageName() || 'Grades' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ stageName() || 'Stage Grades' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Grades assigned to this teacher for the selected education stage.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">school</mat-icon>
            <span>{{ grades().length }} grades</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load grades</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading grades</h3>
          </div>
        } @else if (grades().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">Grade</th>
                  <th class="px-5 py-3">Stage</th>
                  <th class="px-5 py-3 text-center">Subjects</th>
                  <th class="px-5 py-3 text-center">Groups</th>
                  <th class="px-5 py-3 text-center">Students</th>
                  <th class="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (grade of grades(); track grade.id) {
                  <tr class="group cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60" role="link" tabindex="0" (click)="openGradeExams(grade.id)" (keydown.enter)="openGradeExams(grade.id)" (keydown.space)="openGradeExams(grade.id); $event.preventDefault()">
                    <td class="px-5 py-4">
                      <a [routerLink]="['/teacher/exams/basic-education', stageId(), 'grades', grade.id]" class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                          <mat-icon class="text-base">school</mat-icon>
                        </span>
                        <span>
                          <span class="block font-semibold text-slate-900 dark:text-slate-100">{{ grade.name }}</span>
                          <span class="block text-sm text-slate-500 dark:text-slate-400">{{ grade.subjectCount }} subjects</span>
                        </span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ grade.stage }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ grade.subjectCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ grade.groupsCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ grade.studentsCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <a [routerLink]="['/teacher/exams/basic-education', stageId(), 'grades', grade.id]" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="'Open exams for ' + grade.name">
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
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No grades found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No assigned grades are linked to this stage.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TeacherExamsBasicEducationGradesComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stageId = signal(this.route.snapshot.paramMap.get('stageId') ?? '');
  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly stageScopes = computed(() => this.scopes().filter((scope) => isBasicScope(scope) && stageKey(scope) === this.stageId()));
  readonly stageName = computed(() => this.stageScopes()[0]?.stage ?? '');
  readonly grades = computed<TeacherGradeRow[]>(() => {
    const rows = new Map<string, TeacherGradeRow>();
    this.stageScopes().filter((scope) => gradeKey(scope)).forEach((scope) => {
      const id = gradeKey(scope);
      const matching = this.stageScopes().filter((item) => gradeKey(item) === id);
      rows.set(id, {
        id,
        name: scope.grade || 'Grade',
        stage: scope.stage || '',
        subjectCount: uniqueCount(matching.map((item) => subjectKey(item))),
        groupsCount: matching.reduce((sum, item) => sum + item.groupsCount, 0),
        studentsCount: matching.reduce((sum, item) => sum + item.studentsCount, 0),
      });
    });
    return [...rows.values()].sort((left, right) => left.name.localeCompare(right.name));
  });

  constructor() {
    this.loadSetup();
  }

  openGradeExams(gradeId: string): void {
    void this.router.navigate(['/teacher/exams/basic-education', this.stageId(), 'grades', gradeId]);
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
        this.loadError.set(error.message || 'Unable to load assigned grades.');
      },
    });
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
