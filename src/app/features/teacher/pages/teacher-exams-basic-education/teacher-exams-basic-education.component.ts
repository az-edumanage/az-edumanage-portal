import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

interface TeacherStageRow {
  id: string;
  name: string;
  gradeCount: number;
  subjectCount: number;
  classCount: number;
  studentsCount: number;
}

@Component({
  selector: 'app-teacher-exams-basic-education',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/teacher/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">Basic Education</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Basic Education</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Select an education stage linked to this teacher to view its related grades.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">account_tree</mat-icon>
            <span>{{ stages().length }} stages</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load stages</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading stages</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while assigned stages load.</p>
          </div>
        } @else if (stages().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">Stage</th>
                  <th class="px-5 py-3">Teacher Link</th>
                  <th class="px-5 py-3 text-center">Grades</th>
                  <th class="px-5 py-3 text-center">Classes</th>
                  <th class="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (stage of stages(); track stage.id) {
                  <tr class="group transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td class="px-5 py-4">
                      <a [routerLink]="['/teacher/exams/basic-education', stage.id]" class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                          <mat-icon class="text-base">account_tree</mat-icon>
                        </span>
                        <span>
                          <span class="block font-semibold text-slate-900 dark:text-slate-100">{{ stage.name }}</span>
                          <span class="block max-w-2xl truncate text-sm text-slate-500 dark:text-slate-400">{{ stage.subjectCount }} assigned subjects, {{ stage.studentsCount }} students</span>
                        </span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Linked to teacher</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ stage.gradeCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ stage.classCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <a [routerLink]="['/teacher/exams/basic-education', stage.id]" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="'Open grades for ' + stage.name">
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
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No stages found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">This teacher is not assigned to basic education.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TeacherExamsBasicEducationComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly stages = computed<TeacherStageRow[]>(() => {
    const rows = new Map<string, TeacherStageRow>();
    this.scopes()
      .filter((scope) => isBasicScope(scope) && stageKey(scope))
      .forEach((scope) => {
        const id = stageKey(scope);
        const existing = rows.get(id) ?? { id, name: scope.stage || 'Stage', gradeCount: 0, subjectCount: 0, classCount: 0, studentsCount: 0 };
        const stageScopes = this.scopesForStage(id);
        rows.set(id, {
          ...existing,
          gradeCount: uniqueCount(stageScopes.map((item) => item.gradeId)),
          subjectCount: uniqueCount(stageScopes.map((item) => item.subjectId)),
          classCount: stageScopes.reduce((sum, item) => sum + item.groupsCount, 0),
          studentsCount: stageScopes.reduce((sum, item) => sum + item.studentsCount, 0),
        });
      });
    return [...rows.values()].sort((left, right) => left.name.localeCompare(right.name));
  });

  constructor() {
    this.loadSetup();
  }

  private scopesForStage(stageId: string): TeacherExamSetup[] {
    return this.scopes().filter((scope) => stageKey(scope) === stageId);
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
        this.loadError.set(error.message || 'Unable to load assigned exam setup.');
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

function textKey(value: string | null | undefined): string {
  return (value ?? '').trim();
}
