import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  convertToParamMap,
  ActivatedRoute,
  provideRouter,
  Router,
} from "@angular/router";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { TenantSubjectsDataService } from "../../data-access/tenant-subjects-data.service";
import { TenantGroupExamCreateFacade } from "../../state/tenant-group-exam-create.facade";
import { TenantGroupExamCreateComponent } from "./tenant-group-exam-create.component";

describe("TenantGroupExamCreateComponent", () => {
  let fixture: ComponentFixture<TenantGroupExamCreateComponent>;
  let facade: any;
  let subjectsData: any;
  const fb = new FormBuilder();
  const examForm = fb.group({
    selectedExamId: [null as string | null],
    title: [{ value: "", disabled: true }],
    date: ["2026-07-01"],
    startTime: [null as string | null],
    duration: [60],
    instructions: [""],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  beforeEach(async () => {
    sessionStorage.clear();
    examForm.reset({
      selectedExamId: null,
      title: "",
      date: "2026-07-01",
      startTime: null,
      duration: 60,
      instructions: "",
      showResultsImmediately: false,
      allowRetakes: false,
    });
    examForm.controls.title.enable({ emitEvent: false });
    facade = {
      initialize: vi.fn(),
      onDestroy: vi.fn(),
      onCancel: vi.fn(),
      onSubmit: vi.fn(),
      selectPublishedExam: vi.fn(),
      retryExamOptions: vi.fn(),
      setExamSearchQuery: vi.fn(),
      openQuestionPreview: vi.fn(),
      closeQuestionPreview: vi.fn(),
      retryQuestionPreview: vi.fn(),
    } as unknown as TenantGroupExamCreateFacade;
    facade.groupId = signal("group-1");
    facade.isSubmitting = signal(false);
    facade.groupContext = signal({
      id: "group-1",
      name: "Physics G12-A",
      subjectId: "subject-1",
      educationCategory: "BASIC_EDUCATION",
      stageId: "stage-1",
      stageName: "Secondary",
      gradeId: "grade-1",
      gradeName: "Grade 12",
      subject: "Physics",
      teacher: "",
      room: "",
      schedule: "",
      capacity: 0,
      enrolled: 0,
      fees: 0,
      status: "Active",
    });
    facade.isGroupContextLoading = signal(false);
    facade.groupContextError = signal(null);
    facade.publishedExamOptions = signal([
      {
        id: "exam-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Physics Midterm",
        status: "PUBLISHED",
        questionCount: 12,
        updatedAt: "2026-06-20T10:00:00Z",
      },
      {
        id: "exam-2",
        stageId: "stage-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Physics Midterm",
        status: "PUBLISHED",
        questionCount: 9,
        updatedAt: "2026-06-21T10:00:00Z",
      },
    ]);
    facade.allPublishedExamOptions = facade.publishedExamOptions;
    facade.examSearchQuery = signal("");
    facade.isExamOptionsLoading = signal(false);
    facade.examOptionsError = signal(null);
    facade.previewExam = signal(null);
    facade.previewQuestions = signal([]);
    facade.isPreviewOpen = signal(false);
    facade.isPreviewLoading = signal(false);
    facade.previewError = signal(null);
    facade.examForm = examForm;
    subjectsData = {
      getSubjectCurriculum: vi.fn().mockResolvedValue({
        id: "curriculum",
        label: "Physics curriculum",
        icon: "book",
        children: [
          {
            id: "node-motion",
            label: "Motion",
            icon: "topic",
            children: [],
          },
        ],
      }),
      listCurriculumQuestions: vi.fn().mockResolvedValue([
        {
          id: "question-motion",
          curriculumNodeId: "node-motion",
          question: "What is velocity?",
          type: "MULTIPLE_CHOICE",
          answer: null,
          description: null,
          mediaUrl: null,
          mediaFileName: null,
          mediaOriginalName: null,
          mediaContentType: null,
          mediaSizeBytes: null,
          bloomId: null,
          difficultyId: null,
          weight: 1,
          skillId: null,
          questionSource: null,
          answerExplanation: null,
          tags: ["motion"],
          answers: [{ id: "answer-1", answer: "Speed with direction", correct: true }],
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
        },
      ]),
      createBasicEducationExam: vi.fn().mockResolvedValue({
        id: "exam-homework",
        stageId: "stage-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Physics Home Work - 2026-07-01",
        instructions: null,
        status: "DRAFT",
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 1,
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      }),
      updateBasicEducationExamStatus: vi.fn().mockResolvedValue({
        id: "exam-homework",
        stageId: "stage-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Physics Home Work - 2026-07-01",
        instructions: null,
        status: "PUBLISHED",
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 1,
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      }),
      updateBasicEducationExam: vi.fn().mockResolvedValue({
        id: "exam-homework",
        stageId: "stage-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Physics Home Work - 2026-07-01",
        instructions: null,
        status: "PUBLISHED",
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 1,
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      }),
      listBasicEducationExams: vi.fn().mockResolvedValue([
        {
          id: "exam-homework",
          stageId: "stage-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
          title: "Physics Home Work - 2026-07-01",
          instructions: "Solve before class.",
          status: "PUBLISHED",
          shuffleQuestions: true,
          showResultsImmediately: false,
          allowRetakes: false,
          questionCount: 1,
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
        },
      ]),
      listBasicEducationExamLinkedQuestions: vi.fn().mockResolvedValue([
        {
          id: "question-motion",
          curriculumNodeId: "node-motion",
          question: "What is velocity?",
          type: "MULTIPLE_CHOICE",
          answer: null,
          description: null,
          mediaUrl: null,
          mediaFileName: null,
          mediaOriginalName: null,
          mediaContentType: null,
          mediaSizeBytes: null,
          bloomId: null,
          difficultyId: null,
          weight: 1,
          skillId: null,
          questionSource: null,
          answerExplanation: null,
          tags: ["motion"],
          answers: [{ id: "answer-1", answer: "Speed with direction", correct: true }],
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
        },
      ]),
      toUserMessage: vi.fn((_error, fallback) => fallback),
    };

    await TestBed.configureTestingModule({
      imports: [TenantGroupExamCreateComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: TenantGroupExamCreateFacade, useValue: facade },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: "group-1" }),
              data: {},
              queryParams: {
                freshCreate: "true",
                returnTo: "/tenant/groups/group-1/sessions/session-1",
                returnTab: "exams",
                assignmentId: "assignment-1",
                examDate: "2026-07-01",
                examStartTime: "10:00",
              },
              queryParamMap: convertToParamMap({
                freshCreate: "true",
                returnTo: "/tenant/groups/group-1/sessions/session-1",
                returnTab: "exams",
                assignmentId: "assignment-1",
                examDate: "2026-07-01",
                examStartTime: "10:00",
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupExamCreateComponent);
    fixture.detectChanges();
  });

  it("initializes fresh create visits from the quick action query flag", () => {
    expect(facade.initialize).toHaveBeenCalledWith("group-1", true, {
      scope: "tenant",
      returnTo: "/tenant/groups/group-1/sessions/session-1",
      returnTab: "exams",
      assignmentId: "assignment-1",
      selectedExamId: null,
      examDate: "2026-07-01",
      examStartTime: "10:00",
      examDuration: null,
      instructions: null,
      showResultsImmediately: null,
      allowRetakes: null,
    });
  });

  it("uses the question workflow instead of the published exam picker for subject-scoped group homework", async () => {
    const route = TestBed.inject(ActivatedRoute);
    Object.defineProperty(route.snapshot, "queryParams", {
      value: {
        subjectId: "subject-1",
      },
      configurable: true,
    });
    Object.defineProperty(route.snapshot, "queryParamMap", {
      value: convertToParamMap({
        subjectId: "subject-1",
      }),
      configurable: true,
    });
    fixture.destroy();

    fixture = TestBed.createComponent(TenantGroupExamCreateComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.isQuestionBasedHomeWork).toBe(true);
    expect(text).toContain("Questions");
    expect(text).toContain("No questions are linked to this home work.");
    expect(fixture.nativeElement.querySelector(".exam-options")).toBeNull();
    expect(text).not.toContain("Physics Midterm");
  });

  it("renders real group breadcrumbs without placeholder labels", () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Physics G12-A");
    expect(text).toContain("Secondary");
    expect(text).toContain("Grade 12");
    expect(text).toContain("Physics");
    expect(text).toContain("Session Home Work");
    expect(text).toContain("Home Work Details");
    expect(text).toContain("Home Work Title");
    expect(text).toContain("Home Work Date");
    expect(text).toContain("Assign Home Work");
    expect(text).not.toContain("Group Exam");
    expect(text).not.toContain("Create Exam");
  });

  it("allows editing the home work title and shows the session questions section", () => {
    const titleInput: HTMLInputElement =
      fixture.nativeElement.querySelector("#examTitle");
    const text = fixture.nativeElement.textContent as string;

    expect(titleInput.disabled).toBe(false);
    expect(titleInput.readOnly).toBe(false);
    expect(text).toContain("Questions");
    expect(text).toContain("0 questions linked to this home work");
    expect(text).toContain("Add Questions");
    expect(fixture.nativeElement.querySelectorAll(".exam-option").length).toBe(0);
  });

  it("renders optional start time and the Home Work add questions modal", () => {
    const startTimeInput: HTMLInputElement =
      fixture.nativeElement.querySelector("#examStartTime");

    expect(startTimeInput.type).toBe("time");
    fixture.nativeElement.querySelector(".add-questions-button").click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Insert question");
    expect(text).toContain("Add from basic questions");
    expect(text).toContain("Upload file");
    expect(text).not.toContain("Add from questions bank");
  });

  it("does not render removed Save Options controls or Shuffle questions setting", () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain("Save Options");
    expect(text).not.toContain("Save to Center Question Bank");
    expect(text).not.toContain("Save to My Media");
    expect(text).not.toContain("Shuffle questions");
    expect(
      fixture.nativeElement.querySelector(
        '[formControlName="saveToCenterBank"]',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[formControlName="saveToMyMedia"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[formControlName="shuffleQuestions"]',
      ),
    ).toBeNull();
    expect(text).not.toContain("Show results immediately");
    expect(text).toContain("Allow retakes");
  });

  it("opens the group-scoped add question page from Insert question", async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
    fixture.nativeElement.querySelector(".add-questions-button").click();
    fixture.detectChanges();

    const insertQuestionButton = Array.from(
      fixture.nativeElement.querySelectorAll("button"),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Insert question"),
    ) as HTMLButtonElement;
    insertQuestionButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.createBasicEducationExam).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      expect.objectContaining({ questionIds: [] }),
    );
    expect(subjectsData.updateBasicEducationExamStatus).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      "exam-homework",
      { status: "PUBLISHED" },
    );
    expect(navigateSpy).toHaveBeenCalledWith(
      [
        "/tenant/groups",
        "group-1",
        "exam",
        "basic-education",
        "stage-1",
        "grades",
        "grade-1",
        "subjects",
        "subject-1",
        "curriculum",
        "addQuestion",
      ],
      {
        queryParams: expect.objectContaining({
          subjectId: "subject-1",
          examId: "exam-homework",
          returnTo: "/tenant/groups/group-1/sessions/session-1",
        }),
      },
    );
  });

  it("opens selectable basic questions and attaches selected questions to the home work exam", async () => {
    fixture.nativeElement.querySelector(".add-questions-button").click();
    fixture.detectChanges();

    const basicQuestionsButton = Array.from(
      fixture.nativeElement.querySelectorAll("button"),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add from basic questions"),
    ) as HTMLButtonElement;
    basicQuestionsButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector("#basic-questions-drawer") as HTMLElement;
    expect(drawer).not.toBeNull();
    expect(subjectsData.listCurriculumQuestions).toHaveBeenCalledWith("subject-1", "node-motion");
    expect(fixture.nativeElement.textContent).toContain("What is velocity?");

    const row = drawer.querySelector("tbody tr") as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();

    const addSelectedButton = Array.from(drawer.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add selected"),
    ) as HTMLButtonElement;
    addSelectedButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.createBasicEducationExam).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      expect.objectContaining({ questionIds: ["question-motion"] }),
    );
    expect(facade.selectPublishedExam).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "exam-homework",
        title: "Physics Home Work - 2026-07-01",
        questionCount: 1,
      }),
    );
    expect(facade.onSubmit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain("1 questions linked to this home work");
  });

  it("hydrates linked questions from the homework exam query after returning from Insert question", async () => {
    const route = TestBed.inject(ActivatedRoute);
    subjectsData.listBasicEducationExamLinkedQuestions.mockResolvedValue([
      {
        id: "question-motion",
        curriculumNodeId: "node-motion",
        question: "What is velocity?",
        type: "MULTIPLE_CHOICE",
        answer: null,
        description: null,
        mediaUrl: null,
        mediaFileName: null,
        mediaOriginalName: null,
        mediaContentType: null,
        mediaSizeBytes: null,
        bloomId: null,
        difficultyId: null,
        weight: 1,
        skillId: null,
        questionSource: null,
        answerExplanation: null,
        tags: ["motion"],
        answers: [{ id: "answer-1", answer: "Speed with direction", correct: true }],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      },
      {
        id: "question-old",
        curriculumNodeId: "node-motion",
        question: "Old linked question",
        type: "TRUE_FALSE",
        answer: null,
        description: null,
        mediaUrl: null,
        mediaFileName: null,
        mediaOriginalName: null,
        mediaContentType: null,
        mediaSizeBytes: null,
        bloomId: null,
        difficultyId: null,
        weight: 1,
        skillId: null,
        questionSource: null,
        answerExplanation: null,
        tags: [],
        answers: [],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      },
    ]);
    Object.defineProperty(route.snapshot, "queryParamMap", {
      value: convertToParamMap({
        freshCreate: "true",
        returnTo: "/tenant/groups/group-1/sessions/session-1",
        returnTab: "exams",
        examDate: "2026-07-01",
        examStartTime: "10:00",
        examId: "exam-homework",
      }),
      configurable: true,
    });
    const draftKey = "tenant.exam-draft.questions.basic.stage-1.grade-1.subject-1.group.group-1.exam.exam-homework.session.tenant_groups_group-1_sessions_session-1";
    sessionStorage.setItem(draftKey, JSON.stringify(["question-motion"]));

    facade.groupContext.set({ ...facade.groupContext(), name: "Physics G12-A" });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.listBasicEducationExams).toHaveBeenCalledWith("stage-1", "grade-1", "subject-1");
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      "exam-homework",
    );
    expect(examForm.controls.selectedExamId.value).toBe("exam-homework");
    expect(examForm.controls.title.value).toBe("Physics Home Work - 2026-07-01");
    expect(fixture.nativeElement.textContent).toContain("1 questions linked to this home work");
    expect(fixture.nativeElement.textContent).toContain("What is velocity?");
    expect(fixture.nativeElement.textContent).not.toContain("Old linked question");
    expect(sessionStorage.getItem(draftKey)).toBe(JSON.stringify(["question-motion"]));
  });

  it("hydrates all linked questions when editing an existing session home work by selected exam", async () => {
    const route = TestBed.inject(ActivatedRoute);
    subjectsData.listBasicEducationExamLinkedQuestions.mockResolvedValue([
      {
        id: "question-motion",
        curriculumNodeId: "node-motion",
        question: "What is velocity?",
        type: "MULTIPLE_CHOICE",
        answer: null,
        description: null,
        mediaUrl: null,
        mediaFileName: null,
        mediaOriginalName: null,
        mediaContentType: null,
        mediaSizeBytes: null,
        bloomId: null,
        difficultyId: null,
        weight: 1,
        skillId: null,
        questionSource: null,
        answerExplanation: null,
        tags: ["motion"],
        answers: [{ id: "answer-1", answer: "Speed with direction", correct: true }],
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      },
    ]);
    Object.defineProperty(route.snapshot, "queryParamMap", {
      value: convertToParamMap({
        returnTo: "/tenant/groups/group-1/sessions/session-1",
        returnTab: "exams",
        assignmentId: "assignment-1",
        selectedExamId: "exam-homework",
        examDate: "2026-07-01",
        examStartTime: "10:00",
      }),
      configurable: true,
    });

    facade.groupContext.set({ ...facade.groupContext(), name: "Physics G12-A" });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      "exam-homework",
    );
    expect(fixture.nativeElement.textContent).toContain("1 questions linked to this home work");
    expect(fixture.nativeElement.textContent).toContain("What is velocity?");
  });

  it("deletes a linked home work question from the questions section", async () => {
    examForm.patchValue({
      selectedExamId: "exam-homework",
      title: "Physics Home Work - 2026-07-01",
      date: "2026-07-01",
      duration: 60,
      allowRetakes: true,
    });
    fixture.componentInstance.examQuestionRows.set([
      {
        id: "question-motion",
        nodeId: "node-motion",
        question: "What is velocity?",
        type: "MULTIPLE_CHOICE",
        curriculumItem: "Motion",
        answerCount: 1,
        weight: 1,
        tags: ["motion"],
      },
      {
        id: "question-force",
        nodeId: "node-motion",
        question: "What is force?",
        type: "TRUE_FALSE",
        curriculumItem: "Motion",
        answerCount: 2,
        weight: 1,
        tags: [],
      },
    ]);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      '[aria-label="Delete question What is velocity?"]',
    ) as HTMLButtonElement;
    deleteButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.updateBasicEducationExam).toHaveBeenCalledWith(
      "stage-1",
      "grade-1",
      "subject-1",
      "exam-homework",
      expect.objectContaining({
        questionIds: ["question-force"],
        allowRetakes: true,
      }),
    );
    expect(fixture.nativeElement.textContent).toContain("1 questions linked to this home work");
    expect(fixture.nativeElement.textContent).not.toContain("What is velocity?");
    expect(fixture.nativeElement.textContent).toContain("What is force?");
  });
});
