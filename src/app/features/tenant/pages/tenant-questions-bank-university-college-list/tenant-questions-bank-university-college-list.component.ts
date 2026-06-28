import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantCollege } from '../../models/tenant-colleges.models';
import { TenantUniversity } from '../../models/tenant-universities.models';

@Component({
  selector: 'app-tenant-questions-bank-university-college-list',
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a [routerLink]="trackRootLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ trackRootLabel() }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="universityEducationLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">University Education</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ university()?.name || 'University' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ university()?.name || 'University Colleges' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Select a college to view its related subjects.</p>
          </div>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">account_balance</mat-icon>
            <span>{{ colleges().length }} colleges</span>
          </div>
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load colleges</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading colleges</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while related colleges load.</p>
          </div>
        } @else if (!university()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">account_balance</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">University not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected university is not available.</p>
          </div>
        } @else if (colleges().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">College</th>
                  <th class="px-5 py-3">University</th>
                  <th class="px-5 py-3 text-center">Subjects</th>
                  <th class="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (college of colleges(); track college.id) {
                  <tr
                    class="group cursor-pointer transition hover:bg-slate-50 focus-within:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-within:bg-slate-800/60"
                    role="link"
                    tabindex="0"
                    [attr.aria-label]="'Open subjects for ' + college.name"
                    (click)="openCollegeSubjects(college.id)"
                    (keydown.enter)="openCollegeSubjects(college.id)"
                    (keydown.space)="openCollegeSubjects(college.id); $event.preventDefault()"
                  >
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
                          <mat-icon class="text-base">account_balance</mat-icon>
                        </span>
                        <span>
                          <span class="block font-semibold text-slate-900 dark:text-slate-100">{{ college.name }}</span>
                          <span class="block max-w-2xl truncate text-sm text-slate-500 dark:text-slate-400">{{ college.description || 'No description' }}</span>
                        </span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ college.universityName }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ college.subjectCount }}</td>
                    <td class="px-5 py-4 text-right">
                      <button type="button" (click)="openCollegeSubjects(college.id); $event.stopPropagation()" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300" [attr.aria-label]="'Open subjects for ' + college.name">
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
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No colleges found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No colleges are linked to this university yet.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TenantQuestionsBankUniversityCollegeListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collegesData = inject(TenantCollegesDataService);
  private readonly universitiesData = inject(TenantUniversitiesDataService);

  readonly universityId = signal('');
  readonly university = signal<TenantUniversity | null>(null);
  readonly colleges = signal<TenantCollege[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.universityId.set(this.route.snapshot.paramMap.get('universityId') ?? '');
    void this.loadColleges();
  }

  openCollegeSubjects(collegeId: string): void {
    if (this.isExamsContext()) {
      void this.router.navigate(['/tenant/exams/university-education', this.universityId(), 'colleges', collegeId]);
      return;
    }
    void this.router.navigate(['/tenant/questions-bank/university-education/colleges', collegeId]);
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

  private isExamsContext(): boolean {
    return this.router.url.startsWith('/tenant/exams/university-education');
  }

  private async loadColleges(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [university, colleges] = await Promise.all([
        this.universitiesData.getUniversity(this.universityId()),
        this.collegesData.listColleges({ universityId: this.universityId() }),
      ]);
      this.university.set(university);
      this.colleges.set(colleges);
    } catch (error) {
      this.loadError.set(this.collegesData.toUserMessage(error, 'Unable to load colleges. Please try again.'));
      this.university.set(null);
      this.colleges.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
