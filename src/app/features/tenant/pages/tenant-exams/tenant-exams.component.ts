import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
export class TenantExamsComponent {
  readonly educationCards: ExamEducationCard[] = [
    {
      title: 'Basic Education',
      description: 'Open the existing education stages used by the school track before creating or reviewing basic education exams.',
      route: '/tenant/exams/basic-education',
      icon: 'school',
      accentClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
      meta: 'Education stages',
    },
    {
      title: 'University Education',
      description: 'Open the existing universities configured for higher education exam planning and subject organization.',
      route: '/tenant/exams/university-education',
      icon: 'account_balance',
      accentClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
      meta: 'Universities',
    },
  ];
}
