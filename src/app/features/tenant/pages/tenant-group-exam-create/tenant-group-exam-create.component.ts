import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TenantSubjectsDataService } from "../../data-access/tenant-subjects-data.service";
import {
  TenantCurriculumQuestion,
  TenantSubjectCurriculumNode,
} from "../../models/tenant-subjects.models";
import { TenantGroupExamCreateFacade } from "../../state/tenant-group-exam-create.facade";

interface SessionHomeWorkQuestionRow {
  id: string;
  nodeId: string | null;
  question: string;
  type: string;
  curriculumItem: string;
  answerCount: number;
  weight: number | null;
  tags: string[];
}

interface BasicQuestionLoadResult {
  question: TenantCurriculumQuestion;
  nodeId: string;
}

@Component({
  selector: "app-tenant-group-exam-create",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./tenant-group-exam-create.component.html",
  styleUrl: "./tenant-group-exam-create.component.css",
})
export class TenantGroupExamCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantGroupExamCreateFacade);
  private readonly subjectsData = inject(TenantSubjectsDataService);

  readonly groupId = this.facade.groupId;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly groupContext = this.facade.groupContext;
  readonly isGroupContextLoading = this.facade.isGroupContextLoading;
  readonly groupContextError = this.facade.groupContextError;
  readonly publishedExamOptions = this.facade.publishedExamOptions;
  readonly examSearchQuery = this.facade.examSearchQuery;
  readonly isExamOptionsLoading = this.facade.isExamOptionsLoading;
  readonly examOptionsError = this.facade.examOptionsError;
  readonly previewExam = this.facade.previewExam;
  readonly previewQuestions = this.facade.previewQuestions;
  readonly isPreviewOpen = this.facade.isPreviewOpen;
  readonly isPreviewLoading = this.facade.isPreviewLoading;
  readonly previewError = this.facade.previewError;
  readonly examForm = this.facade.examForm;
  readonly questionOptionsOpen = signal(false);
  readonly uploadFileName = signal<string | null>(null);
  readonly questionContextLoading = signal(false);
  readonly questionContextError = signal<string | null>(null);
  readonly basicQuestionsDrawerOpen = signal(false);
  readonly basicQuestionRows = signal<SessionHomeWorkQuestionRow[]>([]);
  readonly basicQuestionSelection = signal<string[]>([]);
  readonly basicQuestionSearchTerm = signal("");
  readonly basicQuestionTypeFilter = signal("All");
  readonly basicQuestionsLoading = signal(false);
  readonly basicQuestionsError = signal<string | null>(null);
  readonly examQuestionRows = signal<SessionHomeWorkQuestionRow[]>([]);
  private hydratedExamQuestionsKey: string | null = null;
  readonly sessionQuestionOptions = [
    {
      kind: "insert",
      label: "Insert question",
      description: "Write a new question for this home work.",
      icon: "edit_note",
    },
    {
      kind: "basic",
      label: "Add from basic questions",
      description: "Use saved questions for this subject.",
      icon: "playlist_add",
    },
  ];
  readonly isTeacherScope = this.route.snapshot.data["scope"] === "teacher";
  readonly groupListRoute = this.isTeacherScope
    ? "/teacher/groups"
    : "/tenant/groups";
  readonly isSessionHomeWork =
    Boolean(
      this.route.snapshot.queryParamMap.get("returnTo")?.includes("/sessions/"),
    ) ||
    Boolean(
      this.route.snapshot.queryParamMap.get("examDate") ||
      this.route.snapshot.queryParamMap.get("examStartTime"),
    );
  readonly isQuestionBasedHomeWork =
    this.isSessionHomeWork ||
    Boolean(this.route.snapshot.queryParamMap.get("subjectId"));
  readonly isHomeWorkEditRoute =
    Boolean(this.route.snapshot.queryParamMap.get("assignmentId")) ||
    Boolean(this.route.snapshot.queryParamMap.get("selectedExamId"));
  readonly basicQuestionTypes = computed(() =>
    Array.from(new Set(this.basicQuestionRows().map((question) => question.type))).sort(),
  );
  readonly filteredBasicQuestionRows = computed(() => {
    const search = this.basicQuestionSearchTerm().trim().toLowerCase();
    const type = this.basicQuestionTypeFilter();
    return this.basicQuestionRows().filter((question) => {
      const matchesType = type === "All" || question.type === type;
      const matchesSearch =
        !search ||
        [
          question.question,
          question.curriculumItem,
          this.questionTypeLabel(question.type),
          ...question.tags,
        ].some((value) => value.toLowerCase().includes(search));
      return matchesType && matchesSearch;
    });
  });
  private readonly hydrateSessionHomeWorkQuestions = effect(() => {
    const context = this.groupContext();
    const examId =
      this.route.snapshot.queryParamMap.get("examId") ||
      this.route.snapshot.queryParamMap.get("selectedExamId");
    if (!this.isQuestionBasedHomeWork || !examId || !this.hasBasicEducationQuestionContext(context)) {
      return;
    }

    const hydrateKey = `${context.stageId}:${context.gradeId}:${context.subjectId}:${examId}`;
    if (this.hydratedExamQuestionsKey === hydrateKey) {
      return;
    }
    this.hydratedExamQuestionsKey = hydrateKey;
    void this.loadSessionHomeWorkExamQuestions(context, examId);
  });
  get assignmentContextLabel(): string {
    return this.isQuestionBasedHomeWork ? "Session Home Work" : "Group Exam";
  }
  get detailsPanelTitle(): string {
    return this.isQuestionBasedHomeWork ? "Home Work Details" : "Exam Details";
  }
  get titleFieldLabel(): string {
    return this.isQuestionBasedHomeWork ? "Home Work Title" : "Exam Title";
  }
  get dateFieldLabel(): string {
    return this.isQuestionBasedHomeWork ? "Home Work Date" : "Exam Date";
  }
  get sourcePanelTitle(): string {
    return this.isQuestionBasedHomeWork ? "Questions" : "Exams";
  }
  get submitLabel(): string {
    return this.isQuestionBasedHomeWork ? "Assign Home Work" : "Create & Publish";
  }
  get submittingLabel(): string {
    return this.isQuestionBasedHomeWork ? "Assigning..." : "Creating...";
  }

  ngOnInit(): void {
    this.facade.initialize(
      this.route.snapshot.paramMap.get("id"),
      this.route.snapshot.queryParamMap.get("freshCreate") === "true",
      {
        scope:
          this.route.snapshot.data["scope"] === "teacher"
            ? "teacher"
            : "tenant",
        returnTo: this.route.snapshot.queryParamMap.get("returnTo"),
        returnTab: this.route.snapshot.queryParamMap.get("returnTab"),
        assignmentId: this.route.snapshot.queryParamMap.get("assignmentId"),
        selectedExamId: this.route.snapshot.queryParamMap.get("selectedExamId"),
        examDate: this.route.snapshot.queryParamMap.get("examDate"),
        examStartTime: this.route.snapshot.queryParamMap.get("examStartTime"),
        examDuration: this.route.snapshot.queryParamMap.get("examDuration"),
        instructions: this.route.snapshot.queryParamMap.get("instructions"),
        showResultsImmediately: this.route.snapshot.queryParamMap.get("showResultsImmediately"),
        allowRetakes: this.route.snapshot.queryParamMap.get("allowRetakes"),
      },
    );
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  async onSubmit(): Promise<void> {
    if (this.isQuestionBasedHomeWork) {
      const context = this.groupContext();
      if (!this.hasBasicEducationQuestionContext(context)) {
        this.questionContextError.set("Choose a basic education group before assigning home work.");
        return;
      }

      this.questionContextLoading.set(true);
      this.questionContextError.set(null);
      try {
        await this.saveSessionHomeWorkExam(this.currentQuestionIds(context));
      } catch (error) {
        this.questionContextError.set(
          this.subjectsData.toUserMessage(
            error,
            "Unable to save home work questions. Please try again.",
          ),
        );
        return;
      } finally {
        this.questionContextLoading.set(false);
      }
    }

    this.facade.onSubmit();
  }

  onSelectExam(examId: string): void {
    const exam = this.facade
      .allPublishedExamOptions()
      .find((option) => option.id === examId);
    if (exam) {
      this.facade.selectPublishedExam(exam);
    }
  }

  onSearchExams(event: Event): void {
    this.facade.setExamSearchQuery((event.target as HTMLInputElement).value);
  }

  onPreviewExam(examId: string): void {
    const exam = this.facade
      .allPublishedExamOptions()
      .find((option) => option.id === examId);
    if (exam) {
      this.facade.openQuestionPreview(exam);
    }
  }

  onClosePreview(): void {
    this.facade.closeQuestionPreview();
  }

  onRetryPreview(): void {
    this.facade.retryQuestionPreview();
  }

  onRetryExamOptions(): void {
    this.facade.retryExamOptions();
  }

  toggleQuestionOptions(): void {
    this.questionOptionsOpen.update((open) => !open);
  }

  closeQuestionOptions(): void {
    this.questionOptionsOpen.set(false);
  }

  async onSelectQuestionOption(kind: string): Promise<void> {
    if (kind === "basic") {
      await this.openBasicQuestionsDrawer();
      return;
    }

    if (kind === "insert") {
      await this.openInsertQuestion();
    }
  }

  onQuestionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.uploadFileName.set(file?.name ?? null);
  }

  closeBasicQuestionsDrawer(): void {
    this.basicQuestionsDrawerOpen.set(false);
    this.basicQuestionsError.set(null);
    this.basicQuestionsLoading.set(false);
  }

  updateBasicQuestionSearch(event: Event): void {
    this.basicQuestionSearchTerm.set(
      (event.target as HTMLInputElement | null)?.value ?? "",
    );
  }

  updateBasicQuestionTypeFilter(event: Event): void {
    this.basicQuestionTypeFilter.set(
      (event.target as HTMLSelectElement | null)?.value || "All",
    );
  }

  isBasicQuestionSelected(questionId: string): boolean {
    return this.basicQuestionSelection().includes(questionId);
  }

  toggleBasicQuestionSelection(questionId: string): void {
    this.basicQuestionSelection.update((selected) =>
      selected.includes(questionId)
        ? selected.filter((id) => id !== questionId)
        : [...selected, questionId],
    );
  }

  async addSelectedBasicQuestions(): Promise<void> {
    const context = this.groupContext();
    if (!this.hasBasicEducationQuestionContext(context)) {
      this.basicQuestionsError.set(
        "Choose a basic education group before adding questions.",
      );
      return;
    }

    const selectedIds = this.basicQuestionSelection();
    if (selectedIds.length === 0) {
      return;
    }

    this.basicQuestionsLoading.set(true);
    this.basicQuestionsError.set(null);
    try {
      const currentIds = this.examQuestionRows().map((question) => question.id);
      const mergedIds = [...currentIds];
      for (const selectedId of selectedIds) {
        if (!mergedIds.includes(selectedId)) {
          mergedIds.push(selectedId);
        }
      }
      const exam = await this.saveSessionHomeWorkExam(mergedIds);
      sessionStorage.setItem(
        this.examQuestionDraftStorageKey(context),
        JSON.stringify(mergedIds),
      );
      this.examQuestionRows.set(
        this.basicQuestionRows().filter((question) => mergedIds.includes(question.id)),
      );
      this.facade.selectPublishedExam({
        id: exam.id,
        stageId: context.stageId,
        gradeId: context.gradeId,
        subjectId: context.subjectId,
        title: exam.title,
        instructions: exam.instructions,
        status: exam.status || "PUBLISHED",
        showResultsImmediately: exam.showResultsImmediately,
        allowRetakes: exam.allowRetakes,
        questionCount: exam.questionCount,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      });
      this.closeBasicQuestionsDrawer();
    } catch (error) {
      this.basicQuestionsError.set(
        this.subjectsData.toUserMessage(
          error,
          "Unable to save selected questions. Please try again.",
        ),
      );
    } finally {
      this.basicQuestionsLoading.set(false);
    }
  }

  async removeHomeWorkQuestion(question: SessionHomeWorkQuestionRow): Promise<void> {
    const context = this.groupContext();
    if (!this.hasBasicEducationQuestionContext(context) || this.questionContextLoading()) {
      return;
    }

    const previousRows = this.examQuestionRows();
    const nextRows = previousRows.filter((row) => row.id !== question.id);
    if (nextRows.length === previousRows.length) {
      return;
    }

    const nextIds = nextRows.map((row) => row.id);
    this.examQuestionRows.set(nextRows);
    this.questionContextLoading.set(true);
    this.questionContextError.set(null);
    try {
      const exam = await this.saveSessionHomeWorkExam(nextIds);
      sessionStorage.setItem(
        this.examQuestionDraftStorageKey(context, exam.id),
        JSON.stringify(nextIds),
      );
      sessionStorage.setItem(
        this.examQuestionDraftStorageKey(context),
        JSON.stringify(nextIds),
      );
    } catch (error) {
      this.examQuestionRows.set(previousRows);
      this.questionContextError.set(
        this.subjectsData.toUserMessage(
          error,
          "Unable to delete question. Please try again.",
        ),
      );
    } finally {
      this.questionContextLoading.set(false);
    }
  }

  questionTypeLabel(type: string): string {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private async openBasicQuestionsDrawer(): Promise<void> {
    const context = this.groupContext();
    if (!this.hasBasicEducationQuestionContext(context)) {
      this.questionContextError.set(
        "Choose a basic education group before adding basic questions.",
      );
      return;
    }

    this.questionOptionsOpen.set(false);
    this.basicQuestionsDrawerOpen.set(true);
    this.basicQuestionsLoading.set(true);
    this.basicQuestionsError.set(null);
    this.basicQuestionSearchTerm.set("");
    this.basicQuestionTypeFilter.set("All");
    this.basicQuestionSelection.set([]);
    try {
      const curriculum = await this.subjectsData.getSubjectCurriculum(
        context.subjectId,
      );
      const questions = await this.loadSubjectCurriculumQuestions(
        context.subjectId,
        curriculum,
      );
      this.basicQuestionRows.set(
        questions.map(({ question, nodeId }) =>
          this.toQuestionRow(question, curriculum, nodeId),
        ),
      );
    } catch (error) {
      this.basicQuestionRows.set([]);
      this.basicQuestionsError.set(
        this.subjectsData.toUserMessage(
          error,
          "Unable to load basic questions. Please try again.",
        ),
      );
    } finally {
      this.basicQuestionsLoading.set(false);
    }
  }

  private async openInsertQuestion(): Promise<void> {
    const context = this.groupContext();
    if (!this.hasBasicEducationQuestionContext(context)) {
      this.questionContextError.set(
        "Choose a basic education group before adding questions.",
      );
      return;
    }

    this.questionContextLoading.set(true);
    this.questionContextError.set(null);
    try {
      const exam = await this.saveSessionHomeWorkExam(this.currentQuestionIds(context));
      const queryParams = {
        ...this.route.snapshot.queryParams,
        subjectId: context.subjectId,
        examId: exam.id,
      };
      this.questionOptionsOpen.set(false);
      await this.router.navigate(
        [
          this.groupListRoute,
          this.groupId(),
          "exam",
          "basic-education",
          context.stageId,
          "grades",
          context.gradeId,
          "subjects",
          context.subjectId,
          "curriculum",
          "addQuestion",
        ],
        { queryParams },
      );
    } catch (error) {
      this.questionContextError.set(
        this.subjectsData.toUserMessage(
          error,
          "Unable to load question setup. Please try again.",
        ),
      );
    } finally {
      this.questionContextLoading.set(false);
    }
  }

  private async saveSessionHomeWorkExam(questionIds: string[]) {
    const context = this.groupContext();
    if (!this.hasBasicEducationQuestionContext(context)) {
      throw new Error("Basic education group context is required.");
    }

    const existingExamId = this.examForm.controls.selectedExamId.value;
    const value = this.examForm.getRawValue();
    const payload = {
      title: (value.title || this.defaultHomeWorkTitle()).trim(),
      instructions: value.instructions || null,
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: value.allowRetakes ?? false,
      questionIds,
    };
    const savedExam = existingExamId
      ? await this.subjectsData.updateBasicEducationExam(
          context.stageId,
          context.gradeId,
          context.subjectId,
          existingExamId,
          payload,
        )
      : await this.subjectsData.createBasicEducationExam(
          context.stageId,
          context.gradeId,
          context.subjectId,
          payload,
        );
    const exam =
      savedExam.status === "PUBLISHED"
        ? savedExam
        : await this.subjectsData.updateBasicEducationExamStatus(
            context.stageId,
            context.gradeId,
            context.subjectId,
            savedExam.id,
            { status: "PUBLISHED" },
          );

    this.examForm.patchValue({
      selectedExamId: exam.id,
      title: exam.title,
      instructions: exam.instructions || value.instructions || "",
      showResultsImmediately: exam.showResultsImmediately,
      allowRetakes: exam.allowRetakes,
    });
    return exam;
  }

  private async loadSessionHomeWorkExamQuestions(
    context: {
      stageId: string;
      gradeId: string;
      subjectId: string;
      subject?: string | null;
    },
    examId: string,
  ): Promise<void> {
    this.questionContextLoading.set(true);
    this.questionContextError.set(null);
    try {
      const [curriculum, exams, questions] = await Promise.all([
        this.subjectsData.getSubjectCurriculum(context.subjectId),
        this.subjectsData.listBasicEducationExams(context.stageId, context.gradeId, context.subjectId),
        this.subjectsData.listBasicEducationExamLinkedQuestions(context.stageId, context.gradeId, context.subjectId, examId),
      ]);
      const exam = exams.find((item) => item.id === examId);
      if (exam) {
        this.examForm.patchValue({
          selectedExamId: exam.id,
          title: exam.title,
          instructions: exam.instructions || this.examForm.controls.instructions.value || "",
          showResultsImmediately: exam.showResultsImmediately,
          allowRetakes: exam.allowRetakes,
        });
      } else {
        this.examForm.patchValue({ selectedExamId: examId });
      }
      const storedIds = this.readStoredQuestionIds(this.examQuestionDraftStorageKey(context, examId));
      const visibleQuestions = storedIds.length > 0
        ? questions.filter((question) => storedIds.includes(question.id))
        : this.isHomeWorkEditRoute
          ? questions
          : [];
      const rows = visibleQuestions.map((question) =>
        this.toQuestionRow(question, curriculum, question.curriculumNodeId),
      );
      this.examQuestionRows.set(rows);
      sessionStorage.setItem(
        this.examQuestionDraftStorageKey(context, examId),
        JSON.stringify(rows.map((question) => question.id)),
      );
    } catch (error) {
      this.questionContextError.set(
        this.subjectsData.toUserMessage(
          error,
          "Unable to load linked homework questions. Please try again.",
        ),
      );
    } finally {
      this.questionContextLoading.set(false);
    }
  }

  private currentQuestionIds(context: {
    stageId: string;
    gradeId: string;
    subjectId: string;
  }): string[] {
    const rowIds = this.examQuestionRows().map((question) => question.id);
    if (rowIds.length > 0) {
      return rowIds;
    }
    try {
      return this.readStoredQuestionIds(this.examQuestionDraftStorageKey(context));
    } catch {
      return [];
    }
  }

  private defaultHomeWorkTitle(): string {
    const context = this.groupContext();
    const date = this.examForm.controls.date.value || new Date().toISOString().split("T")[0];
    return `${context?.subject || "Session"} Home Work - ${date}`;
  }

  private hasBasicEducationQuestionContext(context: unknown): context is {
    educationCategory?: string | null;
    stageId: string;
    gradeId: string;
    subjectId: string;
    subject?: string | null;
  } {
    const group = context as {
      educationCategory?: string | null;
      stageId?: string | null;
      gradeId?: string | null;
      subjectId?: string | null;
    } | null;
    return Boolean(
      group &&
        group.educationCategory === "BASIC_EDUCATION" &&
        group.stageId &&
        group.gradeId &&
        group.subjectId,
    );
  }

  private examQuestionDraftStorageKey(context: {
    stageId: string;
    gradeId: string;
    subjectId: string;
  }, examId = this.examForm.controls.selectedExamId.value ?? this.route.snapshot.queryParamMap.get("examId")): string {
    const base = `tenant.exam-draft.questions.basic.${context.stageId}.${context.gradeId}.${context.subjectId}`;
    if (!this.isQuestionBasedHomeWork) {
      return base;
    }

    const groupId = this.groupId() || this.route.snapshot.paramMap.get("id") || "group";
    const sessionKey =
      this.route.snapshot.queryParamMap.get("returnTo") ||
      [
        this.route.snapshot.queryParamMap.get("examDate"),
        this.route.snapshot.queryParamMap.get("examStartTime"),
      ].filter(Boolean).join(":") ||
      "session";
    return `${base}.group.${groupId}.exam.${examId || "draft"}.session.${this.toStorageKeyPart(sessionKey)}`;
  }

  private readStoredQuestionIds(key: string): string[] {
    const value = sessionStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && !!item)
      : [];
  }

  private toStorageKeyPart(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  }

  private async loadSubjectCurriculumQuestions(
    subjectId: string,
    curriculum: TenantSubjectCurriculumNode | null,
  ): Promise<BasicQuestionLoadResult[]> {
    const nodeIds = curriculum ? this.collectCurriculumNodeIds(curriculum) : [];
    if (nodeIds.length === 0) {
      return [];
    }
    const results = await Promise.allSettled(
      nodeIds.map(async (nodeId) => ({
        nodeId,
        questions: await this.subjectsData.listCurriculumQuestions(subjectId, nodeId),
      })),
    );
    return results
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .flatMap(({ nodeId, questions }) =>
        questions.map((question) => ({ question, nodeId })),
      )
      .filter(
        ({ question }, index, all) =>
          all.findIndex((item) => item.question.id === question.id) === index,
      );
  }

  private collectCurriculumNodeIds(node: TenantSubjectCurriculumNode): string[] {
    return [
      node.id,
      ...node.children.flatMap((child) => this.collectCurriculumNodeIds(child)),
    ].filter((id) => !!id && id !== "curriculum");
  }

  private toQuestionRow(
    question: TenantCurriculumQuestion,
    curriculum: TenantSubjectCurriculumNode | null,
    fallbackNodeId?: string | null,
  ): SessionHomeWorkQuestionRow {
    const nodeId = question.curriculumNodeId ?? fallbackNodeId ?? null;
    return {
      id: question.id,
      nodeId,
      question: question.question || "(Media question)",
      type: question.type,
      curriculumItem:
        this.curriculumNodePathLabel(curriculum, nodeId) ??
        curriculum?.label ??
        this.groupContext()?.subject ??
        "Subject",
      answerCount: question.answers.length,
      weight: question.weight,
      tags: question.tags ?? [],
    };
  }

  private curriculumNodePathLabel(
    node: TenantSubjectCurriculumNode | null,
    nodeId?: string | null,
    parents: string[] = [],
  ): string | null {
    if (!node || !nodeId) {
      return null;
    }
    const path = [...parents, node.label];
    if (node.id === nodeId) {
      return path.join(" / ");
    }
    for (const child of node.children) {
      const label = this.curriculumNodePathLabel(child, nodeId, path);
      if (label) {
        return label;
      }
    }
    return null;
  }
}
