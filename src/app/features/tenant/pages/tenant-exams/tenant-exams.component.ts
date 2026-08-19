import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { TenantCollege } from '../../models/tenant-colleges.models';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantSubject } from '../../models/tenant-subjects.models';
import { TenantUniversity } from '../../models/tenant-universities.models';
import { TenantUniversitySubject } from '../../models/tenant-university-subjects.models';

interface ExamOverviewMetric {
  label: string;
  value: string;
  detail: string;
  icon: string;
  toneClass: string;
}

interface ExamEducationCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  accentClass: string;
  meta: string;
}

@Component({
  selector: 'app-tenant-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 pb-8" aria-labelledby="tenant-exams-title">
      <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a routerLink="/tenant/overview" class="transition-colors hover:text-indigo-600">Tenant</a>
            <mat-icon class="text-[14px]">chevron_right</mat-icon>
            <span>Exams</span>
          </div>
          <h1 id="tenant-exams-title" class="text-2xl font-black text-slate-950 dark:text-white">Exams</h1>
          <p class="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Choose the education track before managing exam setup for the matching academic structure.
          </p>
        </div>
      </header>

      @if (loadError()) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {{ loadError() }}
        </div>
      }

      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Exam overview">
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

      <section class="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Education exam tracks">
        @for (card of educationCards; track card.title) {
          <a
            [routerLink]="card.route"
            class="group flex min-h-56 flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:focus:ring-offset-slate-950"
            [attr.aria-label]="'Open ' + card.title"
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
    </section>
  `,
})
export class TenantExamsComponent implements OnInit {
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly universitiesData = inject(TenantUniversitiesDataService);
  private readonly collegesData = inject(TenantCollegesDataService);
  private readonly universitySubjectsData = inject(TenantUniversitySubjectsDataService);

  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly subjects = signal<TenantSubject[]>([]);
  readonly universities = signal<TenantUniversity[]>([]);
  readonly colleges = signal<TenantCollege[]>([]);
  readonly universitySubjects = signal<TenantUniversitySubject[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly overviewMetrics = computed<ExamOverviewMetric[]>(() => [
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

  readonly educationCards: ExamEducationCard[] = [
    {
      title: 'Basic Education',
      description: 'Open the existing education stages used by the school track before creating or reviewing basic education exams.',
      route: '/tenant/exams/basic-education',
      icon: 'school',
      accentClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
      meta: 'Education stages',
    },
  ];

  ngOnInit(): void {
    void this.loadExamSetupData();
  }

  subjectBankCount(): number {
    return this.subjects().length + this.universitySubjects().length;
  }

  assignedGroupCount(): number {
    return this.subjects().reduce((sum, subject) => sum + subject.assignedGroupsCount, 0)
      + this.universitySubjects().reduce((sum, subject) => sum + subject.groupCount, 0);
  }

  studentCoverageCount(): number {
    return this.grades().reduce((sum, grade) => sum + grade.studentCount, 0)
      + this.universitySubjects().reduce((sum, subject) => sum + subject.studentCount, 0);
  }

  private async loadExamSetupData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [stages, grades, subjects, universities, colleges, universitySubjects] = await Promise.all([
        this.stagesData.listStages(),
        this.gradesData.listGrades(),
        this.subjectsData.listSubjects(),
        this.universitiesData.listUniversities(),
        this.collegesData.listColleges(),
        this.universitySubjectsData.listSubjects(),
      ]);
      this.stages.set(stages);
      this.grades.set(grades);
      this.subjects.set(subjects);
      this.universities.set(universities);
      this.colleges.set(colleges);
      this.universitySubjects.set(universitySubjects);
    } catch (error) {
      this.loadError.set(this.subjectsData.toUserMessage(error, 'Unable to load exam chart data from the backend. Please try again.'));
      this.stages.set([]);
      this.grades.set([]);
      this.subjects.set([]);
      this.universities.set([]);
      this.colleges.set([]);
      this.universitySubjects.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
