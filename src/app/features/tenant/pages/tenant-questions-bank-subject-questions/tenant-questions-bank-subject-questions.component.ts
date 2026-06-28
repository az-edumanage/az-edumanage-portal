import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantCurriculumQuestion, TenantSubject, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';

const ALL_ITEMS_VALUE = '__all__';

interface QuestionBankNodeOption {
  id: string;
  label: string;
  path: string;
}

interface QuestionBankRow {
  id: string;
  questionId: string;
  question: string;
  type: string;
  description: string;
  nodeId: string;
  nodeLabel: string;
  answerCount: number;
}

interface QuestionBankCurriculumChild {
  id: string;
  label: string;
  description: string | null;
  icon: string;
}

@Component({
  selector: 'app-tenant-questions-bank-subject-questions',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
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
        <a [routerLink]="subjectCurriculumLink()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Curriculum</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedNodePath() || 'Questions' }}</span>
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ subject()?.name || 'Subject Questions' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Questions added to this subject question bank.</p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span>Curriculum item</span>
              <select
                class="min-w-56 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                [ngModel]="selectedNodeId()"
                (ngModelChange)="selectedNodeId.set($event)"
              >
                <option [value]="allItemsValue">All Item</option>
                @for (node of nodeOptions(); track node.id) {
                  <option [value]="node.id">{{ node.path }}</option>
                }
              </select>
            </label>
            <a [routerLink]="addQuestionLink()" class="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
              <mat-icon class="text-base">add</mat-icon>
              Add Question
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <label class="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60">
            <mat-icon class="text-base">search</mat-icon>
            <input
              type="search"
              class="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              placeholder="Search questions..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            >
          </label>
          <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <mat-icon class="text-base">quiz</mat-icon>
            <span>{{ filteredRows().length }} questions</span>
          </div>
        </div>

        @if (selectedNodeChildren().length > 0) {
          <div class="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div class="mb-3">
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Curriculum Content</h3>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
                    <th class="px-4 py-3">Content</th>
                    <th class="px-4 py-3">Description</th>
                    <th class="w-24 px-4 py-3 text-center">Questions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  @for (child of selectedNodeChildren(); track child.id) {
                    <tr class="transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td class="px-4 py-3">
                        <a [routerLink]="curriculumNodeLink(child.id)" class="inline-flex items-center gap-2 font-semibold text-slate-900 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300">
                          <mat-icon class="text-base text-indigo-600 dark:text-indigo-300">{{ child.icon }}</mat-icon>
                          {{ child.label }}
                        </a>
                      </td>
                      <td class="px-4 py-3 text-slate-500 dark:text-slate-400">{{ child.description || 'No description' }}</td>
                      <td class="px-4 py-3 text-center">
                        <a [routerLink]="curriculumNodeLink(child.id)" class="inline-flex h-9 w-9 items-center justify-center rounded-md text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-950/30" [attr.aria-label]="'Open questions for ' + child.label">
                          <mat-icon class="text-base">quiz</mat-icon>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">sync</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading questions</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while subject questions load.</p>
          </div>
        } @else if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load questions</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (!nodeOptions().length) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">account_tree</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No curriculum items found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Create curriculum items before adding questions.</p>
          </div>
        } @else if (filteredRows().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3">Question</th>
                  <th class="px-5 py-3">Type</th>
                  <th class="px-5 py-3">Curriculum Item</th>
                  <th class="px-5 py-3 text-center">Answers</th>
                  <th class="w-28 px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                @for (row of filteredRows(); track row.id) {
                  <tr
                    role="button"
                    tabindex="0"
                    class="cursor-pointer transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 dark:hover:bg-slate-800/60"
                    (click)="openQuestion(row)"
                    (keydown.enter)="openQuestion(row)"
                    (keydown.space)="openQuestion(row); $event.preventDefault()"
                    [attr.aria-label]="'Open question overview for ' + row.question"
                  >
                    <td class="px-5 py-4">
                      <div class="font-semibold text-slate-900 dark:text-slate-100">{{ row.question }}</div>
                      <div class="mt-1 max-w-3xl truncate text-sm text-slate-500 dark:text-slate-400">{{ row.description || 'No description' }}</div>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ row.type }}</td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{{ row.nodeLabel }}</td>
                    <td class="px-5 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">{{ row.answerCount }}</td>
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-center gap-2">
                        <a
                          [routerLink]="editQuestionLink(row)"
                          (click)="$event.stopPropagation()"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                          [attr.aria-label]="'Edit question ' + row.question"
                          title="Edit"
                        >
                          <mat-icon class="text-base">edit</mat-icon>
                        </a>
                        <button
                          type="button"
                          (click)="deleteQuestion(row, $event)"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                          [disabled]="deletingQuestionId() === row.questionId"
                          [attr.aria-label]="'Delete question ' + row.question"
                          title="Delete"
                        >
                          <mat-icon class="text-base">{{ deletingQuestionId() === row.questionId ? 'sync' : 'delete' }}</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">No questions found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">No questions match this subject and search.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class TenantQuestionsBankSubjectQuestionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(TenantSubjectsDataService);

  readonly allItemsValue = ALL_ITEMS_VALUE;
  readonly stageId = signal('');
  readonly gradeId = signal('');
  readonly collegeId = signal('');
  readonly subjectId = signal('');
  readonly subject = signal<TenantSubject | null>(null);
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly nodeOptions = signal<QuestionBankNodeOption[]>([]);
  readonly selectedNodeId = signal('');
  readonly rows = signal<QuestionBankRow[]>([]);
  readonly searchQuery = signal('');
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deletingQuestionId = signal<string | null>(null);

  readonly selectedNodeChildren = computed<QuestionBankCurriculumChild[]>(() => {
    const root = this.curriculumRoot();
    const nodeId = this.selectedNodeId();
    if (!root || !nodeId || nodeId === ALL_ITEMS_VALUE) {
      return [];
    }

    const node = this.findNode(root, nodeId);
    return (node?.children ?? []).map((child) => ({
      id: child.id,
      label: child.label,
      description: child.description ?? null,
      icon: child.icon,
    }));
  });

  readonly selectedNodePath = computed(() => {
    const selectedNodeId = this.selectedNodeId();
    if (selectedNodeId === ALL_ITEMS_VALUE) {
      return 'All Item';
    }
    return this.nodeOptions().find((node) => node.id === selectedNodeId)?.path ?? '';
  });

  readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedNodeId = this.selectedNodeId();
    const rows = selectedNodeId && selectedNodeId !== ALL_ITEMS_VALUE
      ? this.rows().filter((row) => row.nodeId === selectedNodeId)
      : this.rows();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      row.question.toLowerCase().includes(query)
      || row.description.toLowerCase().includes(query)
      || row.type.toLowerCase().includes(query)
      || row.nodeLabel.toLowerCase().includes(query),
    );
  });

  readonly addQuestionLink = computed(() => {
    const nodeId = this.selectedNodeId();
    return nodeId && nodeId !== ALL_ITEMS_VALUE
      ? [...this.subjectCurriculumLink(), nodeId, 'addQuestion']
      : this.subjectCurriculumLink();
  });

  readonly subjectCurriculumLink = computed(() => this.isUniversityQuestionsBankRoute()
    ? ['/tenant/questions-bank/university-education/colleges', this.collegeId(), 'subjects', this.subjectId(), 'curriculum']
    : ['/tenant/questions-bank/basic-education', this.stageId(), 'grades', this.gradeId(), 'subjects', this.subjectId(), 'curriculum']);

  curriculumNodeLink(nodeId: string): unknown[] {
    return [...this.subjectCurriculumLink(), nodeId];
  }

  questionOverviewLink(row: QuestionBankRow): unknown[] {
    return [...this.subjectCurriculumLink(), row.nodeId, 'questions', row.questionId];
  }

  editQuestionLink(row: QuestionBankRow): unknown[] {
    return [...this.subjectCurriculumLink(), row.nodeId, 'editQuestion', row.questionId];
  }

  openQuestion(row: QuestionBankRow): void {
    void this.router.navigate(this.questionOverviewLink(row));
  }

  async deleteQuestion(row: QuestionBankRow, event: Event): Promise<void> {
    event.stopPropagation();
    if (this.deletingQuestionId()) {
      return;
    }
    const confirmed = window.confirm(`Delete question "${row.question}"?`);
    if (!confirmed) {
      return;
    }

    this.deletingQuestionId.set(row.questionId);
    this.loadError.set(null);
    try {
      if (this.isBasicQuestionsBankRoute()) {
        await this.data.deleteBasicEducationExamQuestion(this.stageId(), this.gradeId(), this.subjectId(), row.questionId);
      } else {
        await this.data.deleteCurriculumQuestion(this.subjectId(), row.nodeId, row.questionId);
      }
      this.rows.update((rows) => rows.filter((item) => item.id !== row.id));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error, 'Unable to delete question. Please try again.'));
    } finally {
      this.deletingQuestionId.set(null);
    }
  }

  ngOnInit(): void {
    this.stageId.set(this.route.snapshot.paramMap.get('stageId') ?? '');
    this.gradeId.set(this.route.snapshot.paramMap.get('gradeId') ?? '');
    this.collegeId.set(this.route.snapshot.paramMap.get('collegeId') ?? '');
    this.subjectId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.selectedNodeId.set(this.route.snapshot.paramMap.get('nodeId') ?? '');
    void this.loadQuestions();
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

  private async loadQuestions(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const subject = await this.data.getSubjectDetails(this.subjectId());
      const root = await this.data.getSubjectCurriculum(subject.id);
      const nodes = this.flattenCurriculumItems(root);
      this.subject.set(subject);
      this.curriculumRoot.set(root);
      this.nodeOptions.set(nodes);
      if (!this.selectedNodeId() && nodes.length) {
        this.selectedNodeId.set(ALL_ITEMS_VALUE);
      }
      const questionsByNode = await Promise.all(nodes.map((node) => this.loadNodeQuestions(subject.id, node)));
      this.rows.set(questionsByNode.flat());
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error, 'Unable to load subject questions. Please try again.'));
      this.subject.set(null);
      this.curriculumRoot.set(null);
      this.nodeOptions.set([]);
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadNodeQuestions(subjectId: string, node: QuestionBankNodeOption): Promise<QuestionBankRow[]> {
    try {
      if (this.isBasicQuestionsBankRoute()) {
        const questions = await this.data.listBasicEducationExamQuestions(this.stageId(), this.gradeId(), subjectId);
        return questions
          .filter((question) => question.curriculumNodeId === node.id)
          .map((question) => this.toRow(question, node));
      }
      const page = await this.data.listCurriculumQuestionsPage(subjectId, node.id, { page: 0, size: 100 });
      return page.content.map((question) => this.toRow(question, node));
    } catch {
      return [];
    }
  }

  private flattenCurriculumItems(root: TenantSubjectCurriculumNode): QuestionBankNodeOption[] {
    const options: QuestionBankNodeOption[] = [];
    const visit = (node: TenantSubjectCurriculumNode, parents: string[]): void => {
      const path = [...parents, node.label];
      options.push({ id: node.id, label: node.label, path: path.join(' / ') });
      for (const child of node.children ?? []) {
        visit(child, path);
      }
    };
    for (const child of root.children ?? []) {
      visit(child, []);
    }
    return options;
  }

  private findNode(node: TenantSubjectCurriculumNode, nodeId: string): TenantSubjectCurriculumNode | null {
    if (node.id === nodeId) {
      return node;
    }

    for (const child of node.children ?? []) {
      const match = this.findNode(child, nodeId);
      if (match) {
        return match;
      }
    }

    return null;
  }

  private toRow(question: TenantCurriculumQuestion, node: QuestionBankNodeOption): QuestionBankRow {
    return {
      id: `${node.id}-${question.id}`,
      questionId: question.id,
      question: question.question || question.mediaOriginalName || question.mediaFileName || 'Media question',
      type: question.type,
      description: question.description || question.answer || '',
      nodeId: node.id,
      nodeLabel: node.label,
      answerCount: question.answers.length,
    };
  }
}
