import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

interface TeacherUniversityRow {
  id: string;
  name: string;
  collegeCount: number;
  subjectCount: number;
  groupsCount: number;
  studentsCount: number;
}

@Component({
  selector: 'app-teacher-exams-university-education',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/teacher/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">University Education</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">University Education</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Select an assigned university to view its related colleges.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <mat-icon class="text-base">account_balance</mat-icon>
            <span>{{ universities().length }} universities</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center"><mat-icon class="text-3xl text-rose-500">error</mat-icon><p class="mt-3 text-sm text-slate-500">{{ loadError() }}</p></div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center"><mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon><h3 class="mt-3 text-base font-semibold text-slate-900">Loading universities</h3></div>
        } @else if (universities().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr><th class="px-5 py-3">University</th><th class="px-5 py-3 text-center">Colleges</th><th class="px-5 py-3 text-center">Subjects</th><th class="px-5 py-3 text-center">Groups</th><th class="px-5 py-3 text-right">Open</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (university of universities(); track university.id) {
                  <tr class="group transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td class="px-5 py-4">
                      <a [routerLink]="['/teacher/exams/university-education', university.id]" class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300"><mat-icon class="text-base">account_balance</mat-icon></span>
                        <span><span class="block font-semibold text-slate-900 dark:text-slate-100">{{ university.name }}</span><span class="block text-sm text-slate-500 dark:text-slate-400">{{ university.studentsCount }} students</span></span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ university.collegeCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ university.subjectCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ university.groupsCount }}</td>
                    <td class="px-5 py-4 text-right"><a [routerLink]="['/teacher/exams/university-education', university.id]" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300"><mat-icon class="text-base">chevron_right</mat-icon></a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="px-5 py-12 text-center"><mat-icon class="text-3xl text-slate-400">search_off</mat-icon><h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No universities found</h3><p class="mt-1 text-sm text-slate-500 dark:text-slate-400">This teacher is not assigned to university education.</p></div>
        }
      </section>
    </div>
  `,
})
export class TeacherExamsUniversityEducationComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly universities = computed<TeacherUniversityRow[]>(() => {
    const rows = new Map<string, TeacherUniversityRow>();
    this.scopes().filter((scope) => scope.educationCategory === 'UNIVERSITY_EDUCATION' && scope.universityId).forEach((scope) => {
      const id = scope.universityId ?? '';
      const matching = this.scopes().filter((item) => item.universityId === id);
      rows.set(id, {
        id,
        name: scope.university || 'University',
        collegeCount: uniqueCount(matching.map((item) => item.collegeId)),
        subjectCount: uniqueCount(matching.map((item) => item.universitySubjectId)),
        groupsCount: matching.reduce((sum, item) => sum + item.groupsCount, 0),
        studentsCount: matching.reduce((sum, item) => sum + item.studentsCount, 0),
      });
    });
    return [...rows.values()].sort((left, right) => left.name.localeCompare(right.name));
  });

  constructor() {
    this.loadSetup();
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
        this.loadError.set(error.message || 'Unable to load assigned universities.');
      },
    });
  }
}

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter((value): value is string => !!value)).size;
}
