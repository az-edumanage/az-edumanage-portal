import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { TenantCollege } from '../../models/tenant-colleges.models';
import { TenantUniversitySubject } from '../../models/tenant-university-subjects.models';

@Component({
  selector: 'app-tenant-questions-bank-university-subjects',
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a [routerLink]="trackRootLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ trackRootLabel() }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="universityEducationLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">University Education</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ college()?.name || 'College' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ college()?.name || 'College Subjects' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ isExamsContext() ? 'Select a subject to open this college exam list.' : 'Select a subject to open its related question bank curriculum.' }}</p>
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
        } @else if (!college()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">account_balance</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">College not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected college is not available.</p>
          </div>
        } @else if (subjects().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">Subject</th>
                  <th class="px-5 py-3">College</th>
                  <th class="px-5 py-3 text-center">Groups</th>
                  <th class="px-5 py-3 text-center">Students</th>
                  <th class="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (subject of subjects(); track subject.id) {
                  <tr
                    class="group cursor-pointer transition hover:bg-slate-50 focus-within:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-within:bg-slate-800/60"
                    role="link"
                    tabindex="0"
                    [attr.aria-label]="(isExamsContext() ? 'Open exams for ' : 'Open curriculum for ') + subject.name"
                    (click)="openSubjectRow(subject.id)"
                    (keydown.enter)="openSubjectRow(subject.id)"
                    (keydown.space)="openSubjectRow(subject.id); $event.preventDefault()"
                  >
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                          <mat-icon class="text-base">menu_book</mat-icon>
                        </span>
                        <span>
                          <span class="block font-semibold text-slate-900 dark:text-slate-100">{{ subject.name }}</span>
                          <span class="block max-w-2xl truncate text-sm text-slate-500 dark:text-slate-400">{{ subject.description || 'No description' }}</span>
                        </span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ subject.collegeName }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.groupCount }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subject.studentCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <button type="button" (click)="openSubjectRow(subject.id); $event.stopPropagation()" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="(isExamsContext() ? 'Open exams for ' : 'Open curriculum for ') + subject.name">
                        <mat-icon class="text-base">chevron_right</mat-icon>
                      </button>
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
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No subjects are linked to this college yet.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TenantQuestionsBankUniversitySubjectsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collegesData = inject(TenantCollegesDataService);
  private readonly subjectsData = inject(TenantUniversitySubjectsDataService);

  readonly collegeId = signal('');
  readonly universityId = signal('');
  readonly college = signal<TenantCollege | null>(null);
  readonly subjects = signal<TenantUniversitySubject[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.collegeId.set(this.route.snapshot.paramMap.get('collegeId') ?? '');
    this.universityId.set(this.route.snapshot.paramMap.get('universityId') ?? '');
    void this.loadSubjects();
  }

  openSubjectRow(subjectId: string): void {
    if (this.isExamsContext()) {
      void this.router.navigate(['/tenant/exams/university-education', this.universityId(), 'colleges', this.collegeId(), 'create']);
      return;
    }
    void this.router.navigate(['/tenant/questions-bank/university-education/colleges', this.collegeId(), 'subjects', subjectId, 'curriculum']);
  }

  trackRootLabel(): string {
    return this.isExamsContext() ? 'Exams' : 'Questions Bank';
  }

  trackRootLink(): string {
    return this.isExamsContext() ? '/tenant/exams' : '/tenant/questions-bank';
  }

  universityEducationLink(): string {
    return this.isExamsContext() ? '/tenant/exams/university-education' : '/tenant/questions-bank/university-education';
  }

  isExamsContext(): boolean {
    return this.router.url.startsWith('/tenant/exams/university-education');
  }

  private async loadSubjects(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [college, subjects] = await Promise.all([
        this.collegesData.getCollege(this.collegeId()),
        this.subjectsData.listSubjects({ collegeId: this.collegeId() }),
      ]);
      this.college.set(college);
      this.subjects.set(subjects);
    } catch (error) {
      this.loadError.set(this.subjectsData.toUserMessage(error, 'Unable to load college subjects. Please try again.'));
      this.college.set(null);
      this.subjects.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
