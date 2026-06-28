import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantSubject } from '../../models/tenant-subjects.models';

type SubjectAssignmentFilter = 'all' | 'with-groups' | 'without-groups' | 'with-teachers' | 'without-teachers';

@Component({
  selector: 'app-tenant-exams-basic-education-subjects',
  imports: [RouterModule, MatIconModule],
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
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedGrade()?.name || 'Subjects' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ selectedGrade()?.name || 'Grade Subjects' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Subjects related to the selected grade.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">menu_book</mat-icon>
            <span>{{ subjects().length }} subjects</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load subjects</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading subjects</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while related subjects load.</p>
          </div>
        } @else if (!selectedStage() || !selectedGrade()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Grade not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected grade is not available for this education stage.</p>
          </div>
        } @else if (subjects().length > 0) {
          <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <label class="relative block w-full lg:max-w-md">
              <span class="sr-only">Search subjects</span>
              <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</mat-icon>
              <input
                type="search"
                class="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                placeholder="Search subjects"
                [value]="subjectSearch()"
                (input)="setSubjectSearch($any($event.target).value)"
              />
            </label>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span>Filter</span>
                <select
                  class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  [value]="subjectAssignmentFilter()"
                  (change)="setSubjectAssignmentFilter($any($event.target).value)"
                >
                  <option value="all">All subjects</option>
                  <option value="with-groups">With groups</option>
                  <option value="without-groups">Without groups</option>
                  <option value="with-teachers">With teachers</option>
                  <option value="without-teachers">Without teachers</option>
                </select>
              </label>

              <span class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ filteredSubjectsLabel() }}</span>

              @if (activeSubjectFiltersCount() > 0) {
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                  (click)="clearSubjectFilters()"
                >
                  <mat-icon class="text-base">close</mat-icon>
                  Clear
                </button>
              }
            </div>
          </div>

          @if (filteredSubjects().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">Subject</th>
                  <th class="px-5 py-3">Stage</th>
                  <th class="px-5 py-3">Grade</th>
                  <th class="px-5 py-3 text-center">Groups</th>
                  <th class="px-5 py-3 text-center">Teachers</th>
                  <th class="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (subject of filteredSubjects(); track subject.id) {
                  <tr class="group transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td class="px-5 py-4">
                      <a [routerLink]="['/tenant/exams/basic-education', stageId(), 'grades', gradeId(), 'create']" [queryParams]="{ subjectId: subject.id }" class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                          <mat-icon class="text-base">menu_book</mat-icon>
                        </span>
                        <span>
                          <span class="block font-semibold text-slate-900 dark:text-slate-100">{{ subject.name }}</span>
                          <span class="block text-sm text-slate-500 dark:text-slate-400">{{ subject.totalStudentsCount }} students</span>
                        </span>
                      </a>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ subject.stageName }}</td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ subject.gradeName }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.assignedGroupsCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.assignedTeachersCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <a [routerLink]="['/tenant/exams/basic-education', stageId(), 'grades', gradeId(), 'create']" [queryParams]="{ subjectId: subject.id }" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="'Open exams for ' + subject.name">
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
              <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No matching subjects</h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Adjust the search or filter to see more subjects.</p>
            </div>
          }
        } @else {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No subjects found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No subjects are linked to this grade yet.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TenantExamsBasicEducationSubjectsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);

  readonly stageId = signal('');
  readonly gradeId = signal('');
  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly subjects = signal<TenantSubject[]>([]);
  readonly subjectSearch = signal('');
  readonly subjectAssignmentFilter = signal<SubjectAssignmentFilter>('all');
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly selectedStage = computed(() => this.stages().find((stage) => stage.id === this.stageId()) ?? null);
  readonly selectedGrade = computed(() => this.grades().find((grade) => grade.id === this.gradeId() && grade.stageId === this.stageId()) ?? null);
  readonly filteredSubjects = computed(() => {
    const query = this.subjectSearch().trim().toLowerCase();
    const filter = this.subjectAssignmentFilter();

    return this.subjects().filter((subject) => {
      const matchesSearch =
        !query ||
        [subject.name, subject.stageName, subject.gradeName].some((value) => value.toLowerCase().includes(query));
      const matchesFilter = this.matchesAssignmentFilter(subject, filter);

      return matchesSearch && matchesFilter;
    });
  });

  ngOnInit(): void {
    this.stageId.set(this.route.snapshot.paramMap.get('stageId') ?? '');
    this.gradeId.set(this.route.snapshot.paramMap.get('gradeId') ?? '');
    void this.loadGradeSubjects();
  }

  private async loadGradeSubjects(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [stages, grades, subjects] = await Promise.all([
        this.stagesData.listStages(),
        this.gradesData.listGrades(),
        this.subjectsData.listSubjects({ stageId: this.stageId(), gradeId: this.gradeId() }),
      ]);
      this.stages.set(stages);
      this.grades.set(grades);
      this.subjects.set([...subjects].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      this.loadError.set(this.subjectsData.toUserMessage(error));
      this.stages.set([]);
      this.grades.set([]);
      this.subjects.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  setSubjectSearch(value: string): void {
    this.subjectSearch.set(value);
  }

  setSubjectAssignmentFilter(value: string): void {
    this.subjectAssignmentFilter.set(this.isSubjectAssignmentFilter(value) ? value : 'all');
  }

  activeSubjectFiltersCount(): number {
    return (this.subjectSearch().trim() ? 1 : 0) + (this.subjectAssignmentFilter() === 'all' ? 0 : 1);
  }

  clearSubjectFilters(): void {
    this.subjectSearch.set('');
    this.subjectAssignmentFilter.set('all');
  }

  filteredSubjectsLabel(): string {
    const filtered = this.filteredSubjects().length;
    const total = this.subjects().length;

    if (filtered === total) {
      return `${total} ${total === 1 ? 'subject' : 'subjects'}`;
    }

    return `${filtered} of ${total} subjects`;
  }

  private matchesAssignmentFilter(subject: TenantSubject, filter: SubjectAssignmentFilter): boolean {
    switch (filter) {
      case 'with-groups':
        return subject.assignedGroupsCount > 0;
      case 'without-groups':
        return subject.assignedGroupsCount === 0;
      case 'with-teachers':
        return subject.assignedTeachersCount > 0;
      case 'without-teachers':
        return subject.assignedTeachersCount === 0;
      default:
        return true;
    }
  }

  private isSubjectAssignmentFilter(value: string): value is SubjectAssignmentFilter {
    return ['all', 'with-groups', 'without-groups', 'with-teachers', 'without-teachers'].includes(value);
  }
}
