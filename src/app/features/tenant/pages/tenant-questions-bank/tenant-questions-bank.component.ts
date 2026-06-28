import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantQuestionBankOverview, TenantQuestionBankTaggedQuestion } from '../../models/tenant-subjects.models';

interface QuestionBankEducationCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  accentClass: string;
  questions: number;
  structureLabel: string;
  structureCount: number;
}

interface QuestionBankOverviewMetric {
  label: string;
  value: string;
  detail: string;
  icon: string;
  toneClass: string;
}

interface QuestionBankTrackSummary {
  label: string;
  questions: number;
  structureLabel: string;
  structureCount: number;
  coverage: number;
  toneClass: string;
}

interface QuestionBankStatusSummary {
  label: string;
  value: number;
  colorClass: string;
}

const EMPTY_OVERVIEW: TenantQuestionBankOverview = {
  basicEducationQuestions: 0,
  universityEducationQuestions: 0,
  stagesCount: 0,
  universitiesCount: 0,
  tags: [],
  taggedQuestions: [],
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True / False',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  MCQ: 'MCQ',
};

@Component({
  selector: 'app-tenant-questions-bank',
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 pb-8" aria-labelledby="tenant-questions-bank-title">
      <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a routerLink="/tenant/overview" class="transition-colors hover:text-indigo-600">Tenant</a>
            <mat-icon class="text-[14px]">chevron_right</mat-icon>
            <span>Questions Bank</span>
          </div>
          <h1 id="tenant-questions-bank-title" class="text-2xl font-black text-slate-950 dark:text-white">Questions Bank</h1>
          <p class="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Choose the education track before managing question banks for the matching academic structure.
          </p>
        </div>
      </header>

      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Question bank overview">
        @for (metric of overviewMetrics(); track metric.label) {
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ metric.label }}</p>
                <p class="mt-2 text-2xl font-black text-slate-950 dark:text-white">{{ metric.value }}</p>
              </div>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg" [class]="metric.toneClass">
                <mat-icon class="text-xl">{{ metric.icon }}</mat-icon>
              </span>
            </div>
            <p class="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ metric.detail }}</p>
          </div>
        }
      </section>

      @if (loadError()) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300">
          {{ loadError() }}
        </div>
      }

      <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]" aria-label="Question bank charts">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-black text-slate-950 dark:text-white">Track coverage</h2>
              <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Question volume and academic structure by education track.</p>
            </div>
            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              [disabled]="loading()"
              (click)="reloadOverview()"
            >
              <mat-icon class="text-base" [class.animate-spin]="loading()">sync</mat-icon>
              Refresh
            </button>
          </div>

          <div class="mt-5 space-y-5">
            @for (track of trackSummaries(); track track.label) {
              <div>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ track.label }}</p>
                    <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {{ track.questions }} questions, {{ track.structureCount }} {{ track.structureLabel }}
                    </p>
                  </div>
                  <span class="text-sm font-black text-slate-900 dark:text-slate-100">{{ track.coverage }}%</span>
                </div>
                <div class="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" [attr.aria-label]="track.label + ' coverage ' + track.coverage + '%'">
                  <div class="h-full rounded-full" [class]="track.toneClass" [style.width.%]="track.coverage"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 class="text-base font-black text-slate-950 dark:text-white">Question mix</h2>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Current question distribution across all tracks.</p>

          <div class="mt-5 flex items-center gap-5">
            <div
              class="grid h-28 w-28 shrink-0 place-items-center rounded-full"
              [style.background]="questionMixRingBackground()"
              role="img"
              [attr.aria-label]="'Basic education ' + basicEducationShare() + ' percent, university education ' + universityEducationShare() + ' percent'"
            >
              <div class="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-900">
                <span class="text-2xl font-black text-slate-950 dark:text-white">{{ totalQuestions() }}</span>
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
                    <div class="h-full rounded-full" [class]="status.colorClass" [style.width.%]="questionPercent(status.value)"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Question tag browser">
        <div class="border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/40 lg:px-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-800">
                <mat-icon class="text-sm">local_offer</mat-icon>
                Question tags
              </div>
              <h2 class="text-xl font-black text-slate-950 dark:text-white">Browse by saved tag</h2>
              <p class="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Select a tag to review its matching questions, track context, curriculum location, and created date.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div class="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Saved tags</div>
                <div class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ overview().tags.length }}</div>
              </div>
              <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div class="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Tagged questions</div>
                <div class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ taggedQuestionTotal() }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-5 p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:p-6">
          <aside class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div class="mb-3 flex items-center justify-between gap-3 px-1">
              <h3 class="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
                <mat-icon class="text-base text-indigo-500">sell</mat-icon>
                Tags
              </h3>
              @if (selectedTag()) {
                <button type="button" class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-indigo-300" (click)="clearTag()">
                  <mat-icon class="text-sm">close</mat-icon>
                  Clear
                </button>
              }
            </div>

            @if (loading() && overview().tags.length === 0) {
              <div class="space-y-2">
                <div class="h-14 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800"></div>
                <div class="h-14 animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/70"></div>
                <div class="h-14 animate-pulse rounded-lg bg-slate-200/40 dark:bg-slate-800/50"></div>
              </div>
            } @else if (overview().tags.length > 0) {
              <div class="space-y-2">
                @for (tag of overview().tags; track tag.name) {
                  <button
                    type="button"
                    class="group w-full rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    [class.border-indigo-300]="selectedTag() === tag.name"
                    [class.bg-white]="selectedTag() === tag.name"
                    [class.shadow-sm]="selectedTag() === tag.name"
                    [class.dark:border-indigo-700]="selectedTag() === tag.name"
                    [class.dark:bg-slate-900]="selectedTag() === tag.name"
                    [class.border-transparent]="selectedTag() !== tag.name"
                    [class.bg-white/60]="selectedTag() !== tag.name"
                    [class.hover:border-slate-200]="selectedTag() !== tag.name"
                    [class.hover:bg-white]="selectedTag() !== tag.name"
                    [class.dark:bg-slate-900/40]="selectedTag() !== tag.name"
                    [class.dark:hover:border-slate-700]="selectedTag() !== tag.name"
                    [class.dark:hover:bg-slate-900]="selectedTag() !== tag.name"
                    (click)="selectTag(tag.name)"
                  >
                    <span class="flex items-center justify-between gap-3">
                      <span class="flex min-w-0 items-center gap-2">
                        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <mat-icon class="text-base">tag</mat-icon>
                        </span>
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-black text-slate-900 dark:text-slate-100">#{{ tag.name }}</span>
                          <span class="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{{ tag.totalQuestions }} questions</span>
                        </span>
                      </span>
                      <mat-icon class="text-base text-slate-400 transition group-hover:text-indigo-500" [class.text-indigo-500]="selectedTag() === tag.name">arrow_forward</mat-icon>
                    </span>
                    <span class="mt-3 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <span class="block h-full rounded-full bg-indigo-500 dark:bg-indigo-400" [style.width.%]="tagShare(tag.totalQuestions)"></span>
                    </span>
                  </button>
                }
              </div>
            } @else {
              <div class="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900">
                <mat-icon class="text-2xl text-slate-400">sell</mat-icon>
                <p class="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">No tags saved yet.</p>
                <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tags will appear here after questions are labeled.</p>
              </div>
            }
          </aside>

          <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div class="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="flex items-center gap-2 text-base font-black text-slate-950 dark:text-white">
                  <mat-icon class="text-lg text-indigo-500">manage_search</mat-icon>
                  {{ selectedTag() ? '#' + selectedTag() : 'Tagged questions' }}
                </h3>
                <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {{ selectedTag() ? selectedTagQuestionCount() + ' saved questions match this tag.' : 'Pick a saved tag to load matching questions.' }}
                </p>
              </div>
              @if (selectedTag()) {
                <span class="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <mat-icon class="text-sm">filter_alt</mat-icon>
                  Active filter
                </span>
              }
            </div>

            @if (!selectedTag()) {
              <div class="grid min-h-64 place-items-center bg-slate-50 px-6 py-10 text-center dark:bg-slate-950/30">
                <div>
                  <div class="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <mat-icon class="text-2xl">touch_app</mat-icon>
                  </div>
                  <h4 class="mt-4 text-base font-black text-slate-950 dark:text-white">Select a tag</h4>
                  <p class="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    The results table will show each related question with its track, subject, curriculum node, and date.
                  </p>
                </div>
              </div>
            } @else if (loading()) {
              <div class="space-y-3 p-4">
                <div class="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                <div class="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                <div class="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              </div>
            } @else if (overview().taggedQuestions.length > 0) {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead class="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th class="px-4 py-3">Question</th>
                      <th class="px-4 py-3">Track</th>
                      <th class="px-4 py-3">Subject</th>
                      <th class="px-4 py-3">Curriculum</th>
                      <th class="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    @for (question of overview().taggedQuestions; track question.id) {
                      <tr class="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td class="max-w-md px-4 py-3">
                          <a [routerLink]="questionLink(question)" class="font-bold text-slate-950 transition hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300">
                            {{ question.question || 'Media question' }}
                          </a>
                          <div class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ questionTypeLabel(question.type) }}</div>
                        </td>
                        <td class="px-4 py-3">
                          <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-black" [class.bg-indigo-50]="question.track === 'BASIC_EDUCATION'" [class.text-indigo-700]="question.track === 'BASIC_EDUCATION'" [class.bg-emerald-50]="question.track === 'UNIVERSITY_EDUCATION'" [class.text-emerald-700]="question.track === 'UNIVERSITY_EDUCATION'">
                            {{ trackLabel(question.track) }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="font-semibold text-slate-900 dark:text-slate-100">{{ question.subjectName }}</div>
                          <div class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ questionOwnerLabel(question) }}</div>
                        </td>
                        <td class="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{{ question.curriculumNodeName }}</td>
                        <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ formatDate(question.createdAt) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="grid min-h-56 place-items-center bg-slate-50 px-6 py-10 text-center dark:bg-slate-950/30">
                <div>
                  <div class="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <mat-icon class="text-2xl">search_off</mat-icon>
                  </div>
                  <h4 class="mt-4 text-base font-black text-slate-950 dark:text-white">No questions found</h4>
                  <p class="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    This tag is saved, but no question records are currently returned for it.
                  </p>
                </div>
              </div>
            }
          </section>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Education question bank tracks">
        @for (card of educationCards(); track card.title) {
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
            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
                <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <mat-icon class="text-base">quiz</mat-icon>
                  Questions
                </div>
                <div class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ card.questions }}</div>
              </div>
              <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
                <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <mat-icon class="text-base">account_tree</mat-icon>
                  {{ card.structureLabel }}
                </div>
                <div class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ card.structureCount }}</div>
              </div>
            </div>
          </a>
        }
      </section>
    </section>
  `,
})
export class TenantQuestionsBankComponent implements OnInit {
  private readonly data = inject(TenantSubjectsDataService);

  readonly overview = signal<TenantQuestionBankOverview>(EMPTY_OVERVIEW);
  readonly selectedTag = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly totalQuestions = computed(() => {
    const overview = this.overview();
    return overview.basicEducationQuestions + overview.universityEducationQuestions;
  });

  readonly overviewMetrics = computed<QuestionBankOverviewMetric[]>(() => {
    const overview = this.overview();
    return [
      {
        label: 'Total questions',
        value: `${this.totalQuestions()}`,
        detail: 'Across basic and university education tracks.',
        icon: 'quiz',
        toneClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
      },
      {
        label: 'Tagged questions',
        value: `${overview.tags.reduce((sum, tag) => sum + tag.totalQuestions, 0)}`,
        detail: 'Questions organized with saved tag labels.',
        icon: 'sell',
        toneClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
      },
      {
        label: 'Stages',
        value: `${overview.stagesCount}`,
        detail: 'Basic education stages available for question setup.',
        icon: 'layers',
        toneClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
      },
      {
        label: 'Universities',
        value: `${overview.universitiesCount}`,
        detail: 'University structures available for question setup.',
        icon: 'domain',
        toneClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
      },
    ];
  });

  readonly trackSummaries = computed<QuestionBankTrackSummary[]>(() => {
    const overview = this.overview();
    return [
      {
        label: 'Basic Education',
        questions: overview.basicEducationQuestions,
        structureLabel: 'stages',
        structureCount: overview.stagesCount,
        coverage: this.questionPercent(overview.basicEducationQuestions),
        toneClass: 'bg-indigo-500 dark:bg-indigo-400',
      },
      {
        label: 'University Education',
        questions: overview.universityEducationQuestions,
        structureLabel: 'universities',
        structureCount: overview.universitiesCount,
        coverage: this.questionPercent(overview.universityEducationQuestions),
        toneClass: 'bg-emerald-500 dark:bg-emerald-400',
      },
    ];
  });

  readonly statusSummaries = computed<QuestionBankStatusSummary[]>(() => {
    const overview = this.overview();
    return [
      { label: 'Basic', value: overview.basicEducationQuestions, colorClass: 'bg-indigo-500 dark:bg-indigo-400' },
      { label: 'University', value: overview.universityEducationQuestions, colorClass: 'bg-emerald-500 dark:bg-emerald-400' },
    ];
  });

  readonly basicEducationShare = computed(() => this.questionPercent(this.overview().basicEducationQuestions));
  readonly universityEducationShare = computed(() => this.questionPercent(this.overview().universityEducationQuestions));
  readonly taggedQuestionTotal = computed(() => this.overview().tags.reduce((sum, tag) => sum + tag.totalQuestions, 0));
  readonly selectedTagQuestionCount = computed(() => {
    const selectedTag = this.selectedTag();
    if (!selectedTag) {
      return 0;
    }

    return this.overview().tags.find((tag) => tag.name === selectedTag)?.totalQuestions ?? this.overview().taggedQuestions.length;
  });
  readonly questionMixRingBackground = computed(() => {
    const basicEnd = this.basicEducationShare();
    return `conic-gradient(oklch(0.59 0.18 270) 0 ${basicEnd}%, oklch(0.64 0.16 152) ${basicEnd}% 100%)`;
  });

  readonly educationCards = computed<QuestionBankEducationCard[]>(() => {
    const overview = this.overview();
    return [
      {
        title: 'Basic Education',
        description: 'Open basic education subjects before managing curriculum questions for school-track question banks.',
        route: '/tenant/questions-bank/basic-education',
        icon: 'school',
        accentClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
        questions: overview.basicEducationQuestions,
        structureLabel: 'Stages',
        structureCount: overview.stagesCount,
      },
      {
        title: 'University Education',
        description: 'Open university subjects before managing curriculum questions for higher-education question banks.',
        route: '/tenant/questions-bank/university-education',
        icon: 'account_balance',
        accentClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
        questions: overview.universityEducationQuestions,
        structureLabel: 'Universities',
        structureCount: overview.universitiesCount,
      },
    ];
  });

  ngOnInit(): void {
    void this.loadOverview();
  }

  reloadOverview(): void {
    void this.loadOverview(this.selectedTag());
  }

  selectTag(tag: string): void {
    this.selectedTag.set(tag);
    void this.loadOverview(tag);
  }

  clearTag(): void {
    this.selectedTag.set(null);
    void this.loadOverview();
  }

  questionLink(question: TenantQuestionBankTaggedQuestion): unknown[] {
    if (question.track === 'BASIC_EDUCATION' && question.stageId && question.gradeId) {
      return [
        '/tenant/questions-bank/basic-education',
        question.stageId,
        'grades',
        question.gradeId,
        'subjects',
        question.subjectId,
        'curriculum',
        question.curriculumNodeId,
        'questions',
        question.id,
      ];
    }
    return ['/tenant/university-subjects', question.subjectId, 'curriculum', question.curriculumNodeId];
  }

  questionTypeLabel(type: string): string {
    return QUESTION_TYPE_LABELS[type] ?? this.humanizeCode(type);
  }

  trackLabel(track: TenantQuestionBankTaggedQuestion['track']): string {
    return track === 'UNIVERSITY_EDUCATION' ? 'University' : 'Basic';
  }

  questionOwnerLabel(question: TenantQuestionBankTaggedQuestion): string {
    return question.track === 'UNIVERSITY_EDUCATION'
      ? question.universityName || 'University'
      : [question.stageName, question.gradeName].filter(Boolean).join(' / ') || 'Stage';
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleDateString() : 'Not set';
  }

  questionPercent(value: number): number {
    const total = this.totalQuestions();
    if (total === 0) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  tagShare(value: number): number {
    const maxTagQuestions = Math.max(...this.overview().tags.map((tag) => tag.totalQuestions), 0);
    if (maxTagQuestions === 0) {
      return 0;
    }
    return Math.max(8, Math.round((value / maxTagQuestions) * 100));
  }

  private async loadOverview(tag?: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.overview.set(await this.data.getQuestionBankOverview(tag));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error, 'Unable to load question bank overview. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  private humanizeCode(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
