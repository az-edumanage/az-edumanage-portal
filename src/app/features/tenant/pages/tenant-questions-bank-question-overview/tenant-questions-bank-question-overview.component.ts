import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantQuestionType, TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { BloomLevel, QuestionDifficulty, TenantCurriculumQuestion, TenantCurriculumSkill, TenantSubject, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';

interface MetadataItem {
  label: string;
  value: string;
  icon: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True / False',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  MCQ: 'MCQ',
};

const METADATA_TONE_CLASSES: Record<NonNullable<MetadataItem['tone']>, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300',
  accent: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/35 dark:text-indigo-300',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
};

@Component({
  selector: 'app-tenant-questions-bank-question-overview',
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/tenant/questions-bank" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Questions Bank</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="educationRootLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ isUniversityQuestionsBankRoute() ? 'University Education' : 'Basic Education' }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        @if (!isUniversityQuestionsBankRoute()) {
          <a [routerLink]="['/tenant/questions-bank/basic-education', stageId()]" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ subject()?.stageName || 'Stage' }}</a>
          <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        }
        <a [routerLink]="subjectsListLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ isUniversityQuestionsBankRoute() ? (subject()?.gradeName || 'College') : (subject()?.gradeName || 'Grade') }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="subjectCurriculumLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ subject()?.name || 'Subject' }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="questionsLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ selectedNodePath() || 'Questions' }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">Overview</span>
      </nav>

      @if (loading()) {
        <section class="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <mat-icon class="text-3xl text-slate-400">sync</mat-icon>
          <h2 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading question</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while the question metadata loads.</p>
        </section>
      } @else if (loadError()) {
        <section class="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <mat-icon class="text-3xl text-rose-500">error</mat-icon>
          <h2 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load question</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
        </section>
      } @else if (question(); as item) {
        <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="border-b border-slate-200 bg-[radial-gradient(circle_at_12%_15%,rgba(99,102,241,0.16),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(239,246,255,0.86))] px-5 py-5 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_12%_15%,rgba(129,140,248,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.88))] lg:px-6 lg:py-6">
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <mat-icon class="text-sm">psychology</mat-icon>
                    {{ questionTypeDisplay(item) }}
                  </span>
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                    <mat-icon class="text-sm">account_tree</mat-icon>
                    {{ selectedNodePath() || 'Curriculum item' }}
                  </span>
                </div>
                <h1 class="mt-4 max-w-5xl text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-50 lg:text-3xl">{{ questionTitle(item) }}</h1>
                <p class="mt-3 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">{{ item.description || 'No description has been saved for this question.' }}</p>
              </div>
              <div class="flex shrink-0 flex-wrap gap-2">
                <a [routerLink]="questionsLink()" class="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300 dark:hover:bg-slate-800">
                  <mat-icon class="text-base">arrow_back</mat-icon>
                  Back
                </a>
                <a [routerLink]="editQuestionLink()" class="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700">
                  <mat-icon class="text-base">edit</mat-icon>
                  Edit
                </a>
              </div>
            </div>

            <dl class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              @for (summary of summaryMetadata(item); track summary.label) {
                <div class="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/55">
                  <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <mat-icon class="text-base">{{ summary.icon }}</mat-icon>
                    {{ summary.label }}
                  </dt>
                  <dd class="mt-2 break-words text-sm font-bold text-slate-950 dark:text-slate-50">{{ summary.value }}</dd>
                </div>
              }
            </dl>
          </div>

          @if (metadataLookupWarning()) {
            <div class="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
              {{ metadataLookupWarning() }}
            </div>
          }

          <div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div class="space-y-6">
              <section class="space-y-3">
                <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base text-indigo-500">fact_check</mat-icon>
                  Question Metadata
                </h2>
                <dl class="grid gap-3 md:grid-cols-2">
                  @for (metadata of primaryMetadata(item); track metadata.label) {
                    <div class="rounded-lg border p-3" [ngClass]="metadataToneClass(metadata)">
                      <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-80">
                        <mat-icon class="text-base">{{ metadata.icon }}</mat-icon>
                        {{ metadata.label }}
                      </dt>
                      <dd class="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{{ metadata.value }}</dd>
                    </div>
                  }
                </dl>
              </section>

              <section class="space-y-3">
                <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base text-indigo-500">insights</mat-icon>
                  Application Data
                </h2>
                <dl class="grid gap-3 md:grid-cols-2">
                  @for (metadata of applicationMetadata(item); track metadata.label) {
                    <div class="rounded-lg border p-3" [ngClass]="metadataToneClass(metadata)">
                      <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-80">
                        <mat-icon class="text-base">{{ metadata.icon }}</mat-icon>
                        {{ metadata.label }}
                      </dt>
                      <dd class="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{{ metadata.value }}</dd>
                    </div>
                  }
                </dl>
              </section>

              <section class="space-y-3">
                <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base text-indigo-500">rule</mat-icon>
                  Answers
                </h2>
                @if (item.answers.length > 0) {
                  <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                    <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                      <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                        <tr>
                          <th class="px-4 py-3">Answer</th>
                          <th class="px-4 py-3">Description</th>
                          <th class="px-4 py-3 text-center">Correct</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        @for (answer of item.answers; track answer.id) {
                          <tr class="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td class="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{{ answer.answer || answer.mediaOriginalName || answer.mediaFileName || 'Media answer' }}</td>
                            <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ answer.description || 'No description' }}</td>
                            <td class="px-4 py-3 text-center">
                              <mat-icon class="text-base" [class.text-emerald-600]="answer.correct" [class.text-slate-400]="!answer.correct">{{ answer.correct ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">No answers saved.</p>
                }
              </section>
            </div>

            <aside class="space-y-6">
              <section class="space-y-3">
                <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base text-indigo-500">perm_media</mat-icon>
                  Media
                </h2>
                <dl class="space-y-3">
                  @for (metadata of mediaMetadata(item); track metadata.label) {
                    <div class="rounded-lg border p-3" [ngClass]="metadataToneClass(metadata)">
                      <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-80">
                        <mat-icon class="text-base">{{ metadata.icon }}</mat-icon>
                        {{ metadata.label }}
                      </dt>
                      <dd class="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{{ metadata.value }}</dd>
                    </div>
                  }
                </dl>
              </section>

              <section class="space-y-3">
                <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <mat-icon class="text-base text-indigo-500">sell</mat-icon>
                  Tags
                </h2>
                @if ((item.tags ?? []).length > 0) {
                  <div class="flex flex-wrap gap-2">
                    @for (tag of item.tags; track tag) {
                      <span class="rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{{ tag }}</span>
                    }
                  </div>
                } @else {
                  <p class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">No tags saved.</p>
                }
              </section>
            </aside>
          </div>
        </section>
      }
    </div>
  `,
})
export class TenantQuestionsBankQuestionOverviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly questionTypeSettings = inject(TenantQuestionTypeSettingsService);

  readonly stageId = signal('');
  readonly gradeId = signal('');
  readonly collegeId = signal('');
  readonly subjectId = signal('');
  readonly nodeId = signal('');
  readonly questionId = signal('');
  readonly subject = signal<TenantSubject | null>(null);
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly question = signal<TenantCurriculumQuestion | null>(null);
  readonly questionTypes = signal<TenantQuestionType[]>([]);
  readonly bloomLevels = signal<BloomLevel[]>([]);
  readonly questionDifficulties = signal<QuestionDifficulty[]>([]);
  readonly skills = signal<TenantCurriculumSkill[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly metadataLookupWarning = signal<string | null>(null);

  readonly selectedNodePath = computed(() => {
    const root = this.curriculumRoot();
    const nodeId = this.nodeId();
    return root && nodeId ? this.findNodePath(root, nodeId).join(' / ') : '';
  });

  readonly subjectCurriculumLink = computed(() => this.isUniversityQuestionsBankRoute()
    ? ['/tenant/questions-bank/university-education/colleges', this.collegeId(), 'subjects', this.subjectId(), 'curriculum']
    : ['/tenant/questions-bank/basic-education', this.stageId(), 'grades', this.gradeId(), 'subjects', this.subjectId(), 'curriculum']);

  ngOnInit(): void {
    this.stageId.set(this.route.snapshot.paramMap.get('stageId') ?? '');
    this.gradeId.set(this.route.snapshot.paramMap.get('gradeId') ?? '');
    this.collegeId.set(this.route.snapshot.paramMap.get('collegeId') ?? '');
    this.subjectId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.nodeId.set(this.route.snapshot.paramMap.get('nodeId') ?? '');
    this.questionId.set(this.route.snapshot.paramMap.get('questionId') ?? '');
    void this.loadQuestion();
  }

  questionsLink(): unknown[] {
    return [...this.subjectCurriculumLink(), this.nodeId()];
  }

  editQuestionLink(): unknown[] {
    return [...this.subjectCurriculumLink(), this.nodeId(), 'editQuestion', this.questionId()];
  }

  isBasicQuestionsBankRoute(): boolean {
    return this.router.url.startsWith('/tenant/questions-bank/basic-education');
  }

  isUniversityQuestionsBankRoute(): boolean {
    return this.router.url.startsWith('/tenant/questions-bank/university-education');
  }

  educationRootLink(): unknown[] {
    return this.isUniversityQuestionsBankRoute()
      ? ['/tenant/questions-bank/university-education']
      : ['/tenant/questions-bank/basic-education'];
  }

  subjectsListLink(): unknown[] {
    return this.isUniversityQuestionsBankRoute()
      ? ['/tenant/questions-bank/university-education/colleges', this.collegeId()]
      : ['/tenant/questions-bank/basic-education', this.stageId(), 'grades', this.gradeId()];
  }

  questionTitle(question: TenantCurriculumQuestion): string {
    return question.question || question.mediaOriginalName || question.mediaFileName || 'Media question';
  }

  summaryMetadata(question: TenantCurriculumQuestion): MetadataItem[] {
    return [
      { label: 'Type', value: this.questionTypeDisplay(question), icon: 'category', tone: 'accent' },
      { label: 'Difficulty', value: this.questionDifficultyDisplay(question.difficultyId), icon: 'speed', tone: 'warning' },
      { label: 'Skill', value: this.skillDisplay(question.skillId), icon: 'workspace_premium', tone: 'success' },
      { label: 'Weight', value: question.weight == null ? 'Not set' : `${question.weight}`, icon: 'monitor_weight' },
    ];
  }

  primaryMetadata(question: TenantCurriculumQuestion): MetadataItem[] {
    return [
      { label: 'Type', value: this.questionTypeDisplay(question), icon: 'category', tone: 'accent' },
      { label: 'Curriculum Item', value: this.selectedNodePath() || 'Current curriculum item', icon: 'account_tree' },
      { label: 'Description', value: question.description || 'No description', icon: 'notes' },
      { label: 'Answer', value: question.answer || 'No answer', icon: 'task_alt', tone: question.answer ? 'success' : 'neutral' },
      { label: 'Created', value: this.formatDate(question.createdAt), icon: 'event' },
      { label: 'Updated', value: this.formatDate(question.updatedAt), icon: 'update' },
    ];
  }

  applicationMetadata(question: TenantCurriculumQuestion): MetadataItem[] {
    return [
      { label: "Bloom's Taxonomy", value: this.bloomDisplay(question.bloomId), icon: 'psychology', tone: 'accent' },
      { label: 'Difficulty', value: this.questionDifficultyDisplay(question.difficultyId), icon: 'speed', tone: 'warning' },
      { label: 'Skill', value: this.skillDisplay(question.skillId), icon: 'workspace_premium', tone: 'success' },
      { label: 'Weight', value: question.weight == null ? 'Not set' : String(question.weight), icon: 'monitor_weight' },
      { label: 'Question Source', value: question.questionSource || 'Not selected', icon: 'source' },
      { label: 'Answer Explanation', value: question.answerExplanation || 'Not provided', icon: 'tips_and_updates' },
    ];
  }

  mediaMetadata(question: TenantCurriculumQuestion): MetadataItem[] {
    return [
      { label: 'Media URL', value: question.mediaUrl || 'No media', icon: 'link' },
      { label: 'File Name', value: question.mediaFileName || 'No file name', icon: 'draft' },
      { label: 'Original Name', value: question.mediaOriginalName || 'No original name', icon: 'description' },
      { label: 'Content Type', value: question.mediaContentType || 'No content type', icon: 'perm_media' },
      { label: 'Size', value: question.mediaSizeBytes == null ? 'No size' : this.formatFileSize(question.mediaSizeBytes), icon: 'sd_storage' },
    ];
  }

  metadataToneClass(metadata: MetadataItem): string {
    return METADATA_TONE_CLASSES[metadata.tone ?? 'neutral'];
  }

  questionTypeDisplay(question: TenantCurriculumQuestion): string {
    const type = this.questionTypes().find((item) => item.code === question.type || item.name === question.type);
    return type?.name || QUESTION_TYPE_LABELS[question.type] || this.humanizeCode(question.type) || 'Not selected';
  }

  bloomDisplay(bloomId: string | null): string {
    if (!bloomId) {
      return 'Not selected';
    }
    const bloom = this.bloomLevels().find((item) => item.id === bloomId);
    return bloom ? `${bloom.levelOrder}. ${bloom.nameEn}` : 'Bloom level unavailable';
  }

  questionDifficultyDisplay(difficultyId: string | null): string {
    if (!difficultyId) {
      return 'Not selected';
    }
    const difficulty = this.questionDifficulties().find((item) => item.id === difficultyId);
    return difficulty?.nameEn || 'Difficulty unavailable';
  }

  skillDisplay(skillId: string | null): string {
    if (!skillId) {
      return 'Not selected';
    }
    return this.skills().find((skill) => skill.id === skillId)?.name || 'Skill unavailable';
  }

  private async loadQuestion(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.metadataLookupWarning.set(null);
    try {
      const [subject, root, questions, questionTypes, bloomLevels, questionDifficulties, skills] = await Promise.all([
        this.data.getSubjectDetails(this.subjectId()),
        this.data.getSubjectCurriculum(this.subjectId()),
        this.isBasicQuestionsBankRoute()
          ? this.data.listBasicEducationExamQuestions(this.stageId(), this.gradeId(), this.subjectId())
          : this.data.listCurriculumQuestions(this.subjectId(), this.nodeId()),
        this.optionalLookup(() => this.questionTypeSettings.listQuestionTypes()),
        this.optionalLookup(() => this.data.listBloomLevels()),
        this.optionalLookup(() => this.data.listQuestionDifficulties()),
        this.optionalLookup(() => this.data.listCurriculumSkills(this.subjectId(), this.nodeId())),
      ]);
      const question = questions.find((item) => item.id === this.questionId());
      if (!question) {
        throw new Error('Question not found.');
      }
      this.subject.set(subject);
      this.curriculumRoot.set(root);
      this.question.set(question);
      this.questionTypes.set(questionTypes.value);
      this.bloomLevels.set(bloomLevels.value);
      this.questionDifficulties.set(questionDifficulties.value);
      this.skills.set(skills.value);
      if ([questionTypes, bloomLevels, questionDifficulties, skills].some((lookup) => lookup.failed)) {
        this.metadataLookupWarning.set('Some metadata names could not be loaded. Saved values are still available on the question.');
      }
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error, 'Unable to load question metadata. Please try again.'));
      this.subject.set(null);
      this.curriculumRoot.set(null);
      this.question.set(null);
      this.questionTypes.set([]);
      this.bloomLevels.set([]);
      this.questionDifficulties.set([]);
      this.skills.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async optionalLookup<T>(loader: () => Promise<T[]>): Promise<{ value: T[]; failed: boolean }> {
    try {
      return { value: await loader(), failed: false };
    } catch {
      return { value: [], failed: true };
    }
  }

  private findNodePath(node: TenantSubjectCurriculumNode, nodeId: string, parents: string[] = []): string[] {
    const path = [...parents, node.label];
    if (node.id === nodeId) {
      return path;
    }
    for (const child of node.children ?? []) {
      const match = this.findNodePath(child, nodeId, path);
      if (match.length) {
        return match;
      }
    }
    return [];
  }

  private formatDate(value: string): string {
    return value ? new Date(value).toLocaleString() : 'Not set';
  }

  private formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private humanizeCode(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
