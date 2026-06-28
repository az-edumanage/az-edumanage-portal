import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';

interface TeacherExamOverviewMetric {
  label: string;
  value: string;
  detail: string;
  icon: string;
  toneClass: string;
}

interface TeacherExamTrackCard {
  title: string;
  description: string;
  icon: string;
  accentClass: string;
  meta: string;
  route: string;
}

interface TeacherExamTrackSummary {
  label: string;
  parentLabel: string;
  parentCount: number;
  subjectCount: number;
  assignedGroupsCount: number;
  studentCount: number;
  readiness: number;
  toneClass: string;
}

interface TeacherExamStatusSummary {
  label: string;
  value: number;
  colorClass: string;
}

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 pb-8" aria-labelledby="teacher-exams-title">
      <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a routerLink="/teacher/overview" class="transition-colors hover:text-indigo-600">Teacher</a>
            <mat-icon class="text-[14px]">chevron_right</mat-icon>
            <span>Exams</span>
          </div>
          <h1 id="teacher-exams-title" class="text-2xl font-black text-slate-950 dark:text-white">Exams</h1>
          <p class="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Choose the education track before managing exam setup for your assigned academic structure.
          </p>
        </div>
      </header>

      @if (loadError()) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {{ loadError() }}
        </div>
      }

      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Teacher exam overview">
        @for (metric of overviewMetrics(); track metric.label) {
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ metric.label }}</p>
                <p class="mt-2 text-2xl font-black text-slate-950 dark:text-white">{{ loading() ? '...' : metric.value }}</p>
              </div>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg" [class]="metric.toneClass">
                <mat-icon class="text-xl">{{ metric.icon }}</mat-icon>
              </span>
            </div>
            <p class="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ metric.detail }}</p>
          </div>
        }
      </section>

      @if (!loadError()) {
        @if (!loading() && scopes().length === 0) {
          <section class="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span class="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              <mat-icon>assignment</mat-icon>
            </span>
            <h2 class="mt-4 text-lg font-black text-slate-950 dark:text-white">No exam groups assigned</h2>
            <p class="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
              Exams will appear here after your tenant admin assigns groups to your teacher account.
            </p>
          </section>
        } @else {
          <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]" aria-label="Teacher exam charts">
            <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-base font-black text-slate-950 dark:text-white">Track readiness</h2>
                  <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Real backend coverage for the structures exams are created against.</p>
                </div>
                <span class="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <mat-icon class="text-base">insights</mat-icon>
                  Live backend data
                </span>
              </div>

            <div class="mt-5 space-y-5">
              @for (track of trackSummaries(); track track.label) {
                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ track.label }}</p>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {{ track.parentCount }} {{ track.parentLabel }}, {{ track.subjectCount }} subjects, {{ track.assignedGroupsCount }} groups, {{ track.studentCount }} students
                      </p>
                    </div>
                    <span class="text-sm font-black text-slate-900 dark:text-slate-100">{{ track.readiness }}%</span>
                  </div>
                  <div class="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" [attr.aria-label]="track.label + ' readiness ' + track.readiness + '%'">
                    <div class="h-full rounded-full" [class]="track.toneClass" [style.width.%]="track.readiness"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 class="text-base font-black text-slate-950 dark:text-white">Setup data mix</h2>
            <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Backend records contributing to exam planning.</p>

            <div class="mt-5 flex items-center gap-5">
              <div
                class="grid h-28 w-28 shrink-0 place-items-center rounded-full"
                [style.background]="statusRingBackground"
                role="img"
                [attr.aria-label]="structureMixLabel()"
              >
                <div class="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-900">
                  <span class="text-2xl font-black text-slate-950 dark:text-white">{{ structureRecordCount() }}</span>
                  <span class="-mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">total</span>
                </div>
              </div>
              <div class="min-w-0 flex-1 space-y-3">
                @for (status of statusSummaries(); track status.label) {
                  <div>
                    <div class="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <span>{{ status.label }}</span>
                      <span>{{ status.value }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full rounded-full" [class]="status.colorClass" [style.width.%]="statusPercent(status.value)"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
          </section>

          <section class="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Assigned exam tracks">
            @for (card of educationCards(); track card.title) {
              <a
                [routerLink]="card.route"
                class="group flex min-h-56 flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:focus:ring-offset-slate-950"
                [attr.aria-label]="'Open assigned groups for ' + card.title"
              >
                <div>
                  <div class="mb-5 flex items-start justify-between gap-4">
                    <span class="flex h-12 w-12 items-center justify-center rounded-lg" [class]="card.accentClass">
                      <mat-icon class="text-2xl">{{ card.icon }}</mat-icon>
                    </span>
                    <mat-icon class="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-300">arrow_forward</mat-icon>
                  </div>
                  <h2 class="text-xl font-black text-slate-950 dark:text-white">{{ card.title }}</h2>
                  <p class="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{{ card.description }}</p>
                </div>
                <div class="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <mat-icon class="text-base">dataset</mat-icon>
                  <span>{{ card.meta }}</span>
                </div>
              </a>
            }
          </section>
        }
      }
    </section>
  `,
})
export class TeacherExamsComponent {
  private readonly api = inject(TeacherApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly scopes = signal<TeacherExamSetup[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly basicScopes = computed(() => this.scopes().filter((scope) => scope.educationCategory !== 'UNIVERSITY_EDUCATION'));
  readonly universityScopes = computed(() => this.scopes().filter((scope) => scope.educationCategory === 'UNIVERSITY_EDUCATION'));

  readonly trackSummaries = computed<TeacherExamTrackSummary[]>(() => {
    const summaries: TeacherExamTrackSummary[] = [];

    if (this.basicScopes().length > 0) {
      summaries.push(this.trackSummary('Basic Education', 'grades', this.basicScopes(), 'bg-indigo-500 dark:bg-indigo-400'));
    }

    if (this.universityScopes().length > 0) {
      summaries.push(this.trackSummary('University Education', 'colleges', this.universityScopes(), 'bg-emerald-500 dark:bg-emerald-400'));
    }

    return summaries;
  });

  readonly overviewMetrics = computed<TeacherExamOverviewMetric[]>(() => [
    {
      label: 'Exam scopes',
      value: `${this.examScopeCount()}`,
      detail: 'Grades and colleges available for exam planning.',
      icon: 'assignment',
      toneClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    {
      label: 'Subject banks',
      value: `${this.subjectBankCount()}`,
      detail: 'Subjects loaded from basic and university education.',
      icon: 'menu_book',
      toneClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      label: 'Assigned groups',
      value: `${this.assignedGroupCount()}`,
      detail: 'Groups currently linked to exam-ready subjects.',
      icon: 'groups',
      toneClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
      label: 'Students covered',
      value: `${this.studentCoverageCount()}`,
      detail: 'Students reported by grades and university subjects.',
      icon: 'person',
      toneClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    },
  ]);

  readonly statusSummaries = computed<TeacherExamStatusSummary[]>(() => {
    const summaries: TeacherExamStatusSummary[] = [];

    if (this.basicScopes().length > 0) {
      summaries.push({ label: 'Basic setup', value: this.basicStructureCount(), colorClass: 'bg-indigo-500 dark:bg-indigo-400' });
    }

    if (this.universityScopes().length > 0) {
      summaries.push({ label: 'University setup', value: this.universityStructureCount(), colorClass: 'bg-emerald-500 dark:bg-emerald-400' });
    }

    summaries.push({ label: 'Subject banks', value: this.subjectBankCount(), colorClass: 'bg-sky-500 dark:bg-sky-400' });
    return summaries;
  });

  readonly educationCards = computed<TeacherExamTrackCard[]>(() => {
    const cards: TeacherExamTrackCard[] = [];

    if (this.basicScopes().length > 0) {
      const grades = this.uniqueBasicGrades();
      const subjects = this.uniqueValues(this.basicScopes().map((scope) => scope.subject));
      cards.push({
        title: 'Basic Education',
        description: 'Open the grades and subjects assigned to this teacher before creating or reviewing basic education exams.',
        route: '/teacher/exams/basic-education',
        icon: 'school',
        accentClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
        meta: `${this.summaryLabel(grades, 'grades')} · ${this.summaryLabel(subjects, 'subjects')}`,
      });
    }

    if (this.universityScopes().length > 0) {
      const colleges = this.uniqueUniversityColleges();
      const subjects = this.uniqueValues(this.universityScopes().map((scope) => scope.subject));
      cards.push({
        title: 'University Education',
        description: 'Open the colleges and subjects assigned to this teacher for higher education exam planning.',
        route: '/teacher/exams/university-education',
        icon: 'account_balance',
        accentClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
        meta: `${this.summaryLabel(colleges, 'colleges')} · ${this.summaryLabel(subjects, 'subjects')}`,
      });
    }

    return cards;
  });

  constructor() {
    this.loadAssignedExamData();
  }

  get statusRingBackground(): string {
    const basicEnd = this.statusPercent(this.basicStructureCount());
    const universityEnd = basicEnd + this.statusPercent(this.universityStructureCount());
    return `conic-gradient(oklch(0.64 0.16 262) 0 ${basicEnd}%, oklch(0.64 0.14 152) ${basicEnd}% ${universityEnd}%, oklch(0.68 0.13 230) ${universityEnd}% 100%)`;
  }

  statusPercent(value: number): number {
    if (this.structureRecordCount() === 0) {
      return 0;
    }
    return Math.round((value / this.structureRecordCount()) * 100);
  }

  structureMixLabel(): string {
    return `Basic setup ${this.statusPercent(this.basicStructureCount())} percent, university setup ${this.statusPercent(this.universityStructureCount())} percent, subject banks ${this.statusPercent(this.subjectBankCount())} percent`;
  }

  examScopeCount(): number {
    return this.uniqueBasicGrades().length + this.uniqueUniversityColleges().length;
  }

  subjectBankCount(): number {
    return this.uniqueValues(this.scopes().map((scope) => scope.subject)).length;
  }

  assignedGroupCount(): number {
    return this.scopes().reduce((sum, scope) => sum + scope.groupsCount, 0);
  }

  studentCoverageCount(): number {
    return this.scopes().reduce((sum, scope) => sum + scope.studentsCount, 0);
  }

  basicStructureCount(): number {
    return this.uniqueValues([
      ...this.basicScopes().map((scope) => scope.stage),
      ...this.basicScopes().map((scope) => scope.grade),
    ]).length;
  }

  universityStructureCount(): number {
    return this.uniqueValues([
      ...this.universityScopes().map((scope) => scope.university),
      ...this.universityScopes().map((scope) => scope.college),
    ]).length;
  }

  structureRecordCount(): number {
    return this.basicStructureCount() + this.universityStructureCount() + this.subjectBankCount();
  }

  private loadAssignedExamData(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.loadExamSetup()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (scopes) => {
          this.scopes.set(scopes ?? []);
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.scopes.set([]);
          this.loading.set(false);
          this.loadError.set(error.message || 'Unable to load teacher exam data from the backend. Please try again.');
        },
      });
  }

  private trackSummary(label: string, parentLabel: string, scopes: TeacherExamSetup[], toneClass: string): TeacherExamTrackSummary {
    const parentCount = label === 'University Education'
      ? this.uniqueValues(scopes.map((scope) => scope.college)).length
      : this.uniqueValues(scopes.map((scope) => scope.grade)).length;
    const groupsCount = scopes.reduce((sum, scope) => sum + scope.groupsCount, 0);
    const activeScopesCount = scopes.filter((scope) => scope.status?.toLowerCase() === 'active').length;

    return {
      label,
      parentLabel,
      parentCount,
      subjectCount: this.uniqueValues(scopes.map((scope) => scope.subject)).length,
      assignedGroupsCount: groupsCount,
      studentCount: scopes.reduce((sum, scope) => sum + scope.studentsCount, 0),
      readiness: scopes.length === 0 ? 0 : Math.round((activeScopesCount / scopes.length) * 100),
      toneClass,
    };
  }

  private uniqueBasicGrades(): string[] {
    return this.uniqueValues(this.basicScopes().map((scope) => scope.grade));
  }

  private uniqueUniversityColleges(): string[] {
    return this.uniqueValues(this.universityScopes().map((scope) => scope.college));
  }

  private uniqueValues(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))]
      .sort((left, right) => left.localeCompare(right));
  }

  private summaryLabel(values: string[], fallbackPlural: string): string {
    if (values.length === 0) {
      return `0 ${fallbackPlural}`;
    }
    if (values.length <= 2) {
      return values.join(', ');
    }
    return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
  }
}
