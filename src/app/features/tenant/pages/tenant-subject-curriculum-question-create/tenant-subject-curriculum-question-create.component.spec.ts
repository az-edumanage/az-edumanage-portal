import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantQuestionSourceSettingsService } from '../../data-access/tenant-question-source-settings.service';
import { TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';
import { TenantSubjectCurriculumQuestionCreateComponent } from './tenant-subject-curriculum-question-create.component';

describe('TenantSubjectCurriculumQuestionCreateComponent', () => {
  let fixture: ComponentFixture<TenantSubjectCurriculumQuestionCreateComponent>;
  let paramMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;
  const curriculumRoot: TenantSubjectCurriculumNode = {
    id: 'curriculum',
    label: 'Arabic Curriculum',
    icon: 'folder',
    description: null,
    children: [
      {
        id: 'term-1',
        label: 'First Term',
        icon: 'folder',
        description: null,
        children: [
          {
            id: 'lesson-1',
            label: 'Lesson 1',
            icon: 'description',
            description: null,
            children: [],
          },
          {
            id: 'lesson-2',
            label: 'Lesson 2',
            icon: 'description',
            description: null,
            children: [],
          },
        ],
      },
    ],
  };
  const facade = {
    subject: signal({
      id: 'subject-1',
      name: 'Arabic',
      stageId: 'stage-1',
      stageName: 'Primary',
      gradeId: 'grade-1',
      gradeName: 'Grade 3',
      assignedGroupsCount: 0,
      assignedTeachersCount: 0,
      totalStudentsCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      groups: [],
      teachers: [],
    }),
    loading: signal(false),
    loadError: signal<string | null>(null),
    loadSubject: vi.fn().mockResolvedValue(undefined),
  };
  const data = {
    getSubjectCurriculum: vi.fn().mockResolvedValue(curriculumRoot),
    listBloomLevels: vi.fn().mockResolvedValue([
      {
        id: 'bloom-remember',
        code: 'remember',
        nameAr: 'التذكر',
        nameEn: 'Remembering',
        descriptionAr: null,
        descriptionEn: null,
        levelOrder: 1,
      },
      {
        id: 'bloom-understand',
        code: 'understand',
        nameAr: 'الفهم',
        nameEn: 'Understanding',
        descriptionAr: null,
        descriptionEn: null,
        levelOrder: 2,
      },
    ]),
    listQuestionDifficulties: vi.fn().mockResolvedValue([
      {
        id: 'difficulty-easy',
        code: 'easy',
        nameAr: 'سهل',
        nameEn: 'Easy',
        descriptionAr: null,
        descriptionEn: null,
        difficultyOrder: 1,
      },
      {
        id: 'difficulty-medium',
        code: 'medium',
        nameAr: 'متوسط',
        nameEn: 'Medium',
        descriptionAr: null,
        descriptionEn: null,
        difficultyOrder: 2,
      },
      {
        id: 'difficulty-hard',
        code: 'hard',
        nameAr: 'صعب',
        nameEn: 'Hard',
        descriptionAr: null,
        descriptionEn: null,
        difficultyOrder: 3,
      },
    ]),
    listCurriculumSkills: vi.fn().mockImplementation(async (_subjectId: string, nodeId: string) => {
      const skillsByNode = {
        'lesson-1': [
          {
            id: 'skill-1',
            name: 'Critical reading',
            description: 'Identify arguments.',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        'lesson-2': [
          {
            id: 'skill-2',
            name: 'Problem solving',
            description: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      } as const;
      return skillsByNode[nodeId as keyof typeof skillsByNode] ?? [];
    }),
    listCurriculumQuestions: vi.fn().mockResolvedValue([
      {
        id: 'question-1',
        question: 'What is the lesson title?',
        type: 'MULTIPLE_CHOICE',
        answer: null,
        description: 'Choose all valid answers',
        bloomId: 'bloom-understand',
        difficultyId: 'difficulty-medium',
        skillId: 'skill-1',
        weight: 12,
        answers: [
          {
            id: 'answer-1',
            answer: 'Lesson 1',
            correct: true,
            description: 'Intro answer',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    listBasicEducationExamQuestions: vi.fn().mockResolvedValue([
      {
        id: 'exam-question-1',
        question: 'What is the lesson title?',
        type: 'MULTIPLE_CHOICE',
        answer: null,
        description: 'Choose all valid answers',
        bloomId: 'bloom-understand',
        difficultyId: 'difficulty-medium',
        skillId: 'skill-1',
        weight: 12,
        answers: [],
        tags: [],
        questionSource: null,
        answerExplanation: null,
        curriculumNodeId: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    listBasicEducationExamLinkedQuestions: vi.fn().mockResolvedValue([
      {
        id: 'exam-question-1',
        question: 'Editable exam-local question?',
        type: 'MULTIPLE_CHOICE',
        answer: null,
        description: 'Only this exam copy is edited',
        bloomId: 'bloom-understand',
        difficultyId: 'difficulty-medium',
        skillId: 'skill-1',
        weight: 12,
        answers: [],
        tags: [],
        questionSource: null,
        answerExplanation: null,
        curriculumNodeId: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    createBasicEducationExamQuestion: vi.fn().mockResolvedValue({
      id: 'bank-question-1',
      question: 'Question bank only?',
      type: 'TRUE_FALSE',
      answer: null,
      description: null,
      bloomId: null,
      difficultyId: null,
      skillId: null,
      weight: null,
      answers: [],
      tags: [],
      questionSource: null,
      answerExplanation: null,
      curriculumNodeId: 'lesson-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    listBasicEducationExams: vi.fn().mockResolvedValue([
      {
        id: 'exam-1',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Saved Exam',
        instructions: 'Keep instructions',
        status: 'DRAFT',
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    updateBasicEducationExam: vi.fn().mockResolvedValue({
      id: 'exam-1',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
      title: 'Saved Exam',
      instructions: 'Keep instructions',
      status: 'DRAFT',
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
      questionCount: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    }),
    updateBasicEducationExamQuestion: vi.fn().mockResolvedValue({
      id: 'bank-question-1',
      question: 'Question bank only?',
      type: 'TRUE_FALSE',
      answer: null,
      description: null,
      bloomId: null,
      difficultyId: null,
      skillId: null,
      weight: null,
      answers: [],
      tags: [],
      questionSource: null,
      answerExplanation: null,
      curriculumNodeId: 'lesson-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    createCurriculumQuestion: vi.fn().mockResolvedValue({
      id: 'question-1',
      question: 'What is the lesson title?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      bloomId: null,
      difficultyId: null,
      skillId: null,
      weight: null,
      answers: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    updateCurriculumQuestion: vi.fn().mockResolvedValue({
      id: 'question-1',
      question: 'What is the lesson title?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      bloomId: null,
      difficultyId: null,
      skillId: null,
      weight: null,
      answers: [
        {
          id: 'answer-1',
          answer: 'Lesson 1',
          correct: true,
          description: 'Intro answer',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    }),
    createBasicEducationExamQuestionAnswer: vi.fn().mockResolvedValue({
      id: 'bank-answer-1',
      answer: 'true',
      correct: true,
      description: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    updateBasicEducationExamQuestionAnswer: vi.fn().mockResolvedValue({
      id: 'bank-answer-1',
      answer: 'true',
      correct: true,
      description: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    createCurriculumQuestionAnswer: vi.fn().mockResolvedValue({
      id: 'answer-1',
      answer: 'Lesson 1',
      correct: false,
      description: 'Intro answer',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    updateCurriculumQuestionAnswer: vi.fn().mockResolvedValue({
      id: 'answer-1',
      answer: 'Lesson 1',
      correct: true,
      description: 'Intro answer',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    }),
    uploadCurriculumQuestionMedia: vi.fn().mockResolvedValue({
      url: '/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png',
      fileName: 'media.png',
      originalName: 'lesson.png',
      contentType: 'image/png',
      sizeBytes: 10,
    }),
    mediaUrlToAbsolute: vi.fn((url: string | null | undefined) => url ? `http://localhost:18080${url}` : null),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };
  const questionTypeSettings = {
    listQuestionTypes: vi.fn().mockResolvedValue([
      { id: 'type-1', name: 'Multiple Choice', code: 'MULTIPLE_CHOICE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'type-2', name: 'True / False', code: 'TRUE_FALSE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'type-3', name: 'MCQ', code: 'MCQ', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'type-4', name: 'Short Answer', code: 'SHORT_ANSWER', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'type-5', name: 'Essay', code: 'ESSAY', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]),
    toUserMessage: vi.fn().mockReturnValue('Unable to load question types. Please try again.'),
  };
  const questionSourceSettings = {
    listQuestionSources: vi.fn().mockResolvedValue([
      {
        id: 'source-official',
        source: 'Official previous exam',
        description: 'Imported from official exams.',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'source-teacher',
        source: 'Teacher-made',
        description: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    toUserMessage: vi.fn().mockReturnValue('Unable to load question sources. Please try again.'),
  };

  beforeEach(async () => {
    paramMap$ = new ReplaySubject<ReturnType<typeof convertToParamMap>>(1);
    await TestBed.configureTestingModule({
      imports: [TenantSubjectCurriculumQuestionCreateComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectDetailsFacade, useValue: facade },
        { provide: TenantSubjectsDataService, useValue: data },
        { provide: TenantQuestionTypeSettingsService, useValue: questionTypeSettings },
        { provide: TenantQuestionSourceSettingsService, useValue: questionSourceSettings },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable(), snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectCurriculumQuestionCreateComponent);
    paramMap$.next(convertToParamMap({ id: 'subject-1', nodeId: 'lesson-1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    TestBed.inject(I18nService).setLanguage('en');
    vi.clearAllMocks();
  });

  it('renders the add question form for the selected curriculum item', () => {
    let text = fixture.nativeElement.textContent as string;

    expect(facade.loadSubject).toHaveBeenCalledWith('subject-1');
    expect(data.getSubjectCurriculum).toHaveBeenCalledWith('subject-1');
    expect(questionTypeSettings.listQuestionTypes).toHaveBeenCalled();
    expect(questionSourceSettings.listQuestionSources).toHaveBeenCalled();
    expect(data.listBloomLevels).toHaveBeenCalled();
    expect(data.listQuestionDifficulties).toHaveBeenCalled();
    expect(text).toContain('Subject');
    expect(text).toContain('Subject Details');
    expect(text).toContain('Curriculum');
    expect(text).toContain('Arabic Curriculum');
    expect(text).toContain('First Term');
    expect(text).toContain('Lesson 1');
    expect(text).toContain('Add Question');
    expect(text).toContain('Question Information');
    expect(text).not.toContain('Analytical Data');
    expect(text).not.toContain('Application Data');
    expect(fixture.nativeElement.querySelector('[role="switch"][aria-label="Toggle Analytical Data"]')).toBeNull();
    expect(data.listCurriculumSkills).toHaveBeenCalledWith('subject-1', 'lesson-1');
    expect(data.listCurriculumSkills).toHaveBeenCalledWith('subject-1', 'lesson-2');
    expect(fixture.componentInstance.questionForm.controls.questionSource.value).toBe('');
    expect(text).toContain('Type');
    const fieldLabels = Array.from(fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>)
      .map((label) => label.textContent?.trim());
    expect(fieldLabels).toContain('Type');
    expect(text).toContain('Select question type');
    expect(fixture.nativeElement.querySelector('#question')).toBeNull();
    expect(fixture.nativeElement.querySelector('#answer')).toBeNull();
    expect(fixture.nativeElement.querySelector('#description')).toBeNull();
    expect(text).not.toContain('Multiple Choice');
    expect(text).not.toContain('Correct');
    expect(fixture.componentInstance.questionForm.controls.type.value).toBe('');
    fixture.componentInstance.toggleTypeSelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Multiple Choice');
    expect(text).toContain('True / False');
    fixture.componentInstance.selectQuestionType('Multiple Choice');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Multiple Questions');
    expect(text).toContain('Single Question');
    expect(text).not.toContain('Correct');
    expect(text).not.toContain('Analytical Data');
    expect(text).not.toContain('Application Data');
    fixture.componentInstance.selectMultipleChoiceMode('single');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    const questionEditor = fixture.nativeElement.querySelector('#question') as HTMLTextAreaElement;
    expect(questionEditor).toBeTruthy();
    expect(questionEditor.tagName.toLowerCase()).toBe('textarea');
    expect(text).toContain('Question editor');
    expect(text).toContain('Answer');
    expect(text).toContain('Correct');
    expect(text).toContain('Add');
    expect(fixture.nativeElement.querySelector('#description')).toBeTruthy();
    expect(text).toContain('Description');
    expect(text).toContain('Analytical Data');
    expect(text).toContain('Topic');
    expect(text).toContain("Bloom's Taxonomy");
    expect(text).toContain("Select Bloom's Taxonomy level");
    fixture.componentInstance.toggleBloomTaxonomySelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('1. Remembering');
    expect(text).toContain('2. Understanding');
    fixture.componentInstance.toggleBloomTaxonomySelector();
    fixture.componentInstance.toggleSkillSelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Skill');
    expect(text).toContain('Select skill');
    expect(text).toContain('Critical reading');
    expect(text).toContain('Problem solving');
    fixture.componentInstance.toggleSkillSelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Difficulty');
    expect(text).toContain('Easy');
    expect(text).toContain('Medium');
    expect(text).toContain('Hard');
    expect(text).toContain('The Weight');
    const typeTrigger = fixture.nativeElement.querySelector('#type') as HTMLButtonElement;
    const bloomSelector = fixture.nativeElement.querySelector('#bloomTaxonomy') as HTMLButtonElement;
    const skillSelector = fixture.nativeElement.querySelector('#questionSkill') as HTMLButtonElement;
    const weightInput = fixture.nativeElement.querySelector('#questionWeight') as HTMLInputElement;
    expect(typeTrigger.className).toContain('h-[46px]');
    expect(bloomSelector.className).toContain('h-[46px]');
    expect(skillSelector.className).toContain('h-[46px]');
    expect(weightInput.className).toContain('h-[46px]');
    expect(weightInput.placeholder).toBe('Enter weight');
    expect(text).toContain('Application Data');
    expect(text).toContain('Question Source');
    expect(text).toContain('Select source');
    expect((fixture.nativeElement.querySelector('#questionSource') as HTMLButtonElement).className).toContain('h-[46px]');
    fixture.componentInstance.toggleQuestionSourceSelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Official previous exam');
    expect(text).toContain('Teacher-made');
    expect(text).toContain('Save Question');
  });

  it('renders exam breadcrumb and cancels back to exam create with subject query', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue(
      '/tenant/exams/basic-education/stage-1/grades/grade-1/create/new/subjects/subject-1/curriculum/lesson-1/addQuestion',
    );
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    paramMap$.next(convertToParamMap({
      stageId: 'stage-1',
      gradeId: 'grade-1',
      id: 'subject-1',
      nodeId: 'lesson-1',
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => anchor as HTMLAnchorElement);
    expect(text).toContain('Exams');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Grade 3');
    expect(text).toContain('Arabic');
    expect(text).not.toContain('Curriculum');
    expect(text).not.toContain('Lesson 1');
    expect(text).not.toContain('Subject Details');
    expect(links.some((anchor) =>
      anchor.pathname === '/tenant/exams/basic-education/stage-1/grades/grade-1/create/new' &&
      anchor.search === '?subjectId=subject-1',
    )).toBe(true);

    fixture.componentInstance.cancel();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/tenant/exams/basic-education', 'stage-1', 'grades', 'grade-1', 'create', 'new'],
      { queryParams: { subjectId: 'subject-1' } },
    );
  });

  it('shows the subject curriculum scope on exam question edit routes without a curriculum item', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue(
      '/tenant/exams/basic-education/stage-1/grades/grade-1/create/new/subjects/subject-1/curriculum/editQuestion/exam-question-1',
    );

    paramMap$.next(convertToParamMap({
      stageId: 'stage-1',
      gradeId: 'grade-1',
      id: 'subject-1',
      questionId: 'exam-question-1',
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const topicSection = Array.from(fixture.nativeElement.querySelectorAll('.border-indigo-200') as NodeListOf<HTMLElement>)
      .find((section) => section.textContent?.includes('Topic')) as HTMLElement | undefined;

    expect(data.listBasicEducationExamQuestions).toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1');
    expect(text).toContain('Curriculum Item');
    expect(text).toContain('Current item');
    expect(text).toContain('Arabic Curriculum');
    expect(topicSection?.textContent).toContain('Topic');
    expect(topicSection?.textContent).toContain('Arabic Curriculum');
    expect(text).not.toContain('Lesson 1');
  });

  it('loads linked exam questions when editing a saved exam-local question copy', async () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    vi.spyOn(router, 'url', 'get').mockReturnValue(
      '/tenant/exams/basic-education/stage-1/grades/grade-1/create/new/subjects/subject-1/curriculum/editQuestion/exam-question-1?subjectId=subject-1&examId=exam-1',
    );
    Object.defineProperty(route.snapshot, 'queryParamMap', { value: convertToParamMap({ subjectId: 'subject-1', examId: 'exam-1' }), configurable: true });

    paramMap$.next(convertToParamMap({
      stageId: 'stage-1',
      gradeId: 'grade-1',
      id: 'subject-1',
      questionId: 'exam-question-1',
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1', 'exam-1');
    expect(data.listBasicEducationExamQuestions).not.toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1');
    expect(fixture.componentInstance.questionForm.controls.question.value).toBe('Editable exam-local question?');
  });

  it('shows analytical data only after Single Question is selected', () => {
    let text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Analytical Data');
    expect(text).not.toContain('Application Data');
    fixture.componentInstance.selectQuestionType('Multiple Choice');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Analytical Data');
    expect(text).not.toContain('Application Data');

    fixture.componentInstance.selectMultipleChoiceMode('single');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Analytical Data');
    expect(text).toContain('Application Data');
    expect(fixture.nativeElement.querySelector('[role="switch"][aria-label="Toggle Analytical Data"]')).toBeNull();
    expect(text).not.toContain('Inactive');
    expect(text).not.toContain('Active');
  });

  it('renders Arabic labels and RTL direction when Arabic is selected', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('ar');
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('[dir="rtl"]') as HTMLElement | null;
    let text = fixture.nativeElement.textContent as string;

    expect(page).toBeTruthy();
    expect(text).toContain('المادة');
    expect(text).toContain('تفاصيل المادة');
    expect(text).toContain('المنهج');
    expect(text).toContain('منهج Arabic');
    expect(text).toContain('إضافة سؤال');
    expect(text).toContain('بيانات السؤال');
    expect(text).not.toContain('البيانات التحليلية');
    expect(text).toContain('اختر نوع السؤال');

    fixture.componentInstance.selectQuestionType('اختيار من متعدد');
    fixture.componentInstance.selectMultipleChoiceMode('single');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;

    expect(text).toContain('أسئلة متعددة');
    expect(text).toContain('سؤال واحد');
    expect(text).toContain('البيانات التحليلية');
    expect(text).toContain('الموضوع');
    expect(text).toContain('تصنيف بلوم');
    fixture.componentInstance.toggleBloomTaxonomySelector();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('1. التذكر');
    expect(text).toContain('الصعوبة');
    expect(text).toContain('سهل');
    expect(text).toContain('الوزن');
    expect(fixture.componentInstance.questionForm.controls.type.value).toBe('MULTIPLE_CHOICE');
  });

  it('returns to the curriculum item details page after a valid save', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.questionForm.patchValue({
      question: 'What is the lesson title?',
      bloomId: 'bloom-understand',
      difficultyId: 'difficulty-medium',
      skillId: 'skill-1',
      questionSource: 'Official previous exam',
      answerExplanation: 'Because the official key marks this option.',
    });
    component.setQuestionWeightValue('12abc');
    expect(component.questionForm.controls.weight.value).toBe('12');
    const letterKeyEvent = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    component.preventNonNumericWeightInput(letterKeyEvent);
    expect(letterKeyEvent.defaultPrevented).toBe(true);
    const digitKeyEvent = new KeyboardEvent('keydown', { key: '3', cancelable: true });
    component.preventNonNumericWeightInput(digitKeyEvent);
    expect(digitKeyEvent.defaultPrevented).toBe(false);
    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    await component.saveQuestion();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'What is the lesson title?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: '',
      bloomId: 'bloom-understand',
      difficultyId: 'difficulty-medium',
      skillId: 'skill-1',
      weight: 12,
      questionSource: 'Official previous exam',
      answerExplanation: 'Because the official key marks this option.',
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('appends inserted exam questions to existing saved exam questions', async () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(route.snapshot, 'queryParamMap', { value: convertToParamMap({ examId: 'exam-1' }), configurable: true });
    sessionStorage.setItem('tenant.exam-draft.questions.basic.stage-1.grade-1.subject-1', JSON.stringify(['question-root-one']));
    paramMap$.next(convertToParamMap({ stageId: 'stage-1', gradeId: 'grade-1', id: 'subject-1', nodeId: 'lesson-1' }));
    await fixture.whenStable();

    const component = fixture.componentInstance;
    vi.spyOn(component, 'isExamQuestionRoute').mockReturnValue(true);
    component.questionForm.patchValue({ question: 'Inserted question?' });
    component.selectQuestionType('True / False');
    await component.saveQuestion();

    expect(data.createBasicEducationExamQuestion).toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1', expect.objectContaining({
      question: 'Inserted question?',
      type: 'TRUE_FALSE',
      curriculumNodeId: 'lesson-1',
    }));
    expect(data.updateBasicEducationExam).toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1', 'exam-1', expect.objectContaining({
      title: 'Saved Exam',
      instructions: 'Keep instructions',
      questionIds: ['question-root-one', 'bank-question-1'],
    }));
    expect(sessionStorage.getItem('tenant.exam-draft.questions.basic.stage-1.grade-1.subject-1')).toBe(JSON.stringify(['question-root-one', 'bank-question-1']));
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/exams/basic-education', 'stage-1', 'grades', 'grade-1', 'create', 'new'], { queryParams: { subjectId: 'subject-1', examId: 'exam-1' } });
  });

  it('saves basic question-bank questions to the separated question-bank store', async () => {
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { get: () => '', configurable: true });
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    paramMap$.next(convertToParamMap({ stageId: 'stage-1', gradeId: 'grade-1', id: 'subject-1', nodeId: 'lesson-1' }));
    await fixture.whenStable();

    const component = fixture.componentInstance;
    vi.spyOn(component, 'usesBasicEducationQuestionBankStore').mockReturnValue(true);
    component.questionForm.patchValue({ question: 'Question bank only?' });
    component.selectQuestionType('True / False');
    component.trueFalseAnswer.set(true);
    await component.saveQuestion();

    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();
    expect(data.createBasicEducationExamQuestion).toHaveBeenCalledWith('stage-1', 'grade-1', 'subject-1', expect.objectContaining({
      question: 'Question bank only?',
      type: 'TRUE_FALSE',
      curriculumNodeId: 'lesson-1',
    }));
  });

  it('saves multiple choice answers through the backend and updates correct choices', async () => {
    const component = fixture.componentInstance;

    component.questionForm.patchValue({ question: 'What is the lesson title?' });
    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.openAnswerModal();
    component.setNewAnswer('Lesson 1');
    component.setNewAnswerDescription('Intro answer');
    await component.saveAnswer();
    fixture.detectChanges();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'What is the lesson title?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: '',
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson 1',
      correct: false,
      description: 'Intro answer',
    });
    expect(component.showAnswerModal()).toBe(false);
    expect(component.multipleChoiceAnswers()).toEqual([
      {
        id: 'answer-1',
        answer: 'Lesson 1',
        correct: false,
        description: 'Intro answer',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    await component.toggleAnswerCorrect(component.multipleChoiceAnswers()[0], { target: checkbox } as unknown as Event);

    expect(data.updateCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', 'answer-1', {
      correct: true,
    });
    expect(component.multipleChoiceAnswers()[0].correct).toBe(true);
  });

  it('uses the multiple choice form for MCQ and keeps only one answer correct', async () => {
    const component = fixture.componentInstance;
    const firstAnswer = {
      id: 'answer-1',
      answer: 'Lesson 1',
      correct: true,
      description: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const secondAnswer = {
      id: 'answer-2',
      answer: 'Lesson 2',
      correct: false,
      description: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    data.updateCurriculumQuestionAnswer
      .mockResolvedValueOnce({ ...secondAnswer, correct: true })
      .mockResolvedValueOnce({ ...firstAnswer, correct: false });

    component.questionForm.patchValue({ question: 'Choose one?' });
    component.selectQuestionType('MCQ');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Multiple Questions');
    expect(fixture.nativeElement.textContent).toContain('Single Question');

    component.selectMultipleChoiceMode('single');
    component.currentQuestionId.set('question-1');
    component.multipleChoiceAnswers.set([firstAnswer, secondAnswer]);
    component.answerDrafts.set({
      [firstAnswer.id]: { answer: firstAnswer.answer, description: '', correct: true },
      [secondAnswer.id]: { answer: secondAnswer.answer, description: '', correct: false },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mark one answer as correct.');

    const checkbox = document.createElement('input');
    checkbox.checked = true;
    await component.toggleAnswerCorrect(secondAnswer, { target: checkbox } as unknown as Event);

    expect(data.updateCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', 'answer-2', {
      correct: true,
    });
    expect(data.updateCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', 'answer-1', {
      correct: false,
    });
    expect(component.multipleChoiceAnswers().map((answer) => [answer.id, answer.correct])).toEqual([
      ['answer-1', false],
      ['answer-2', true],
    ]);
  });

  it('uploads media as the answer when answer text is empty', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:answer-media');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const component = fixture.componentInstance;
    const file = new File(['answer-image'], 'answer.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });

    component.questionForm.patchValue({ question: 'What is the lesson title?' });
    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.openAnswerModal();
    component.onAnswerMediaSelected({ target: input } as unknown as Event);
    await component.saveAnswer();

    expect(data.uploadCurriculumQuestionMedia).toHaveBeenCalledWith(file);
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: '',
      correct: false,
      description: '',
      mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png',
      mediaFileName: 'media.png',
      mediaOriginalName: 'lesson.png',
      mediaContentType: 'image/png',
      mediaSizeBytes: 10,
    });
    expect(component.newAnswerMediaOption()).toBeNull();
  });

  it('saves bulk multiple choice questions from the overlay', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('multiple');
    component.setBulkQuestionsText([
      'Q : What is the lesson title?',
      '-\tcorrect, Lesson 1',
      '-\tLesson 2',
      '',
      'س : ما اسم الدرس؟',
      '-\tصح, الدرس الأول',
      '-\tالدرس الثاني',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'What is the lesson title?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'ما اسم الدرس؟',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson 1',
      correct: true,
      description: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson 2',
      correct: false,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('saves bulk MCQ questions only when each question has exactly one correct answer', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.selectQuestionType('MCQ');
    component.selectMultipleChoiceMode('multiple');
    component.setBulkQuestionsText([
      'Q : Choose one?',
      '-\tcorrect, Lesson 1',
      '-\tcorrect, Lesson 2',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(component.bulkQuestionError()).toBe('Question "Choose one?" must have exactly one correct answer.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.setBulkQuestionsText([
      'Q : Choose one?',
      '-\tcorrect, Lesson 1',
      '-\tLesson 2',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'Choose one?',
      type: 'MCQ',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson 1',
      correct: true,
      description: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson 2',
      correct: false,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('uses the multiple choice flow for short answer and saves one answer only', async () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('Short Answer');
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Multiple Questions');
    expect(text).toContain('Single Question');

    component.selectMultipleChoiceMode('single');
    component.questionForm.patchValue({ question: 'What is the title?' });
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Add one answer only, no more than 5 words.');

    await component.saveQuestion();
    expect(component.questionSaveError()).toBe('Short Answer questions must have one answer only.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.openAnswerModal();
    component.setNewAnswer('one two three four five six');
    await component.saveAnswer();
    expect(component.newAnswerError()).toBe('Short Answer must be no more than 5 words.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.setNewAnswer('Lesson title');
    await component.saveAnswer();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'What is the title?',
      type: 'SHORT_ANSWER',
      answer: null,
      description: '',
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson title',
      correct: true,
      description: '',
    });
    expect(component.multipleChoiceAnswers()).toHaveLength(1);

    component.openAnswerModal();
    component.setNewAnswer('Second answer');
    await component.saveAnswer();

    expect(component.newAnswerError()).toBe('Short Answer questions can have one answer only.');
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledTimes(1);
  });

  it('saves bulk short answer questions only with one answer of no more than five words', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.selectQuestionType('Short Answer');
    component.selectMultipleChoiceMode('multiple');
    component.setBulkQuestionsText([
      'Q : What is the title?',
      '-\tcorrect, one two three four five six',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(component.bulkQuestionError()).toBe('Question "What is the title?" answer must be no more than 5 words.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.setBulkQuestionsText([
      'Q : What is the title?',
      '-\tcorrect, Lesson title',
      '-\tAnother answer',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(component.bulkQuestionError()).toBe('Question "What is the title?" must have one answer only.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.setBulkQuestionsText([
      'Q : What is the title?',
      '-\tcorrect, Lesson title',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'What is the title?',
      type: 'SHORT_ANSWER',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'Lesson title',
      correct: true,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('uses the short answer flow for essay and saves one unlimited answer only', async () => {
    const component = fixture.componentInstance;
    const longEssayAnswer = 'one two three four five six seven eight nine ten eleven twelve';

    component.selectQuestionType('Essay');
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Multiple Questions');
    expect(text).toContain('Single Question');

    component.selectMultipleChoiceMode('single');
    component.questionForm.patchValue({ question: 'Explain the lesson?' });
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Add one answer only. Essay answers can use unlimited words.');

    await component.saveQuestion();
    expect(component.questionSaveError()).toBe('Essay questions must have one answer only.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.openAnswerModal();
    component.setNewAnswer(longEssayAnswer);
    await component.saveAnswer();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'Explain the lesson?',
      type: 'ESSAY',
      answer: null,
      description: '',
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: longEssayAnswer,
      correct: true,
      description: '',
    });
    expect(component.multipleChoiceAnswers()).toHaveLength(1);

    component.openAnswerModal();
    component.setNewAnswer('Second essay answer');
    await component.saveAnswer();

    expect(component.newAnswerError()).toBe('Essay questions can have one answer only.');
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledTimes(1);
  });

  it('saves bulk essay questions with one unlimited answer only', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;
    const longEssayAnswer = 'one two three four five six seven eight nine ten eleven twelve';

    component.selectQuestionType('Essay');
    component.selectMultipleChoiceMode('multiple');
    component.setBulkQuestionsText([
      'Q : Explain the lesson?',
      `-\tcorrect, ${longEssayAnswer}`,
      '-\tAnother answer',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(component.bulkQuestionError()).toBe('Question "Explain the lesson?" must have one answer only.');
    expect(data.createCurriculumQuestion).not.toHaveBeenCalled();

    component.setBulkQuestionsText([
      'Q : Explain the lesson?',
      `-\tcorrect, ${longEssayAnswer}`,
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'Explain the lesson?',
      type: 'ESSAY',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: longEssayAnswer,
      correct: true,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('opens the MathLive editor from bulk multiple choice questions and inserts LaTeX into the overlay text', () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('multiple');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Open MathLive editor"]')).toBeTruthy();

    component.setBulkQuestionsText('Q : Solve?');
    component.openMathEditor('bulk');
    component.setMathEditorValue({ target: { value: '\\sqrt{4}=2' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.bulkQuestionsText()).toBe('Q : Solve? \\(\\sqrt{4}=2\\)');
    expect(component.questionForm.controls.question.value).toBe('');
    expect(component.showMathEditor()).toBe(false);
    expect(component.showBulkQuestionOverlay()).toBe(true);
  });

  it('shows true false question modes and saves a single true false question with fixed answers', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.selectQuestionType('True / False');
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Multiple Questions');
    expect(text).toContain('Single Question');

    component.selectMultipleChoiceMode('single');
    component.questionForm.patchValue({ question: 'Water boils at 100 degrees?' });
    component.selectTrueFalseAnswer(true);
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    const trueButton = fixture.nativeElement.querySelector('button[aria-pressed="true"]') as HTMLButtonElement;
    const falseButton = Array.from(fixture.nativeElement.querySelectorAll('button[aria-pressed="false"]') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.includes('False')) as HTMLButtonElement | undefined;
    expect(text).toContain('Selected');
    expect(trueButton.textContent).toContain('True');
    expect(trueButton.className).toContain('min-h-28');
    expect(trueButton.className).toContain('shadow-sm');
    expect(trueButton.className).toContain('ring-indigo-200');
    expect(falseButton).toBeTruthy();

    await component.saveQuestion();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'Water boils at 100 degrees?',
      type: 'TRUE_FALSE',
      answer: null,
      description: '',
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'True',
      correct: true,
      description: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'False',
      correct: false,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('shows MathLive controls for true false single and multiple question modes', () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('True / False');
    component.selectMultipleChoiceMode('single');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Open MathLive editor"]')).toBeTruthy();

    component.setQuestionValue('Check');
    component.openMathEditor('question');
    component.setMathEditorValue({ target: { value: '\\sqrt{4}=2' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.questionForm.controls.question.value).toBe('Check \\(\\sqrt{4}=2\\)');

    component.selectMultipleChoiceMode('multiple');
    fixture.detectChanges();

    expect(component.showBulkQuestionOverlay()).toBe(true);
    expect(fixture.nativeElement.querySelector('[aria-label="Open MathLive editor"]')).toBeTruthy();

    component.setBulkQuestionsText('q : Is it correct? , true');
    component.openMathEditor('bulk');
    component.setMathEditorValue({ target: { value: '\\frac{1}{2}' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.bulkQuestionsText()).toBe('q : Is it correct? , true \\(\\frac{1}{2}\\)');
  });

  it('saves bulk true false questions from the overlay', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.selectQuestionType('True / False');
    component.selectMultipleChoiceMode('multiple');
    component.setBulkQuestionsText([
      'q : Water boils at 100 degrees?, true',
      'س : الشمس تشرق من الغرب؟, صح',
    ].join('\n'));
    await component.saveBulkQuestions();

    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'Water boils at 100 degrees?',
      type: 'TRUE_FALSE',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: 'الشمس تشرق من الغرب؟',
      type: 'TRUE_FALSE',
      answer: null,
      description: null,
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'True',
      correct: true,
      description: null,
    });
    expect(data.createCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      answer: 'False',
      correct: false,
      description: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('shows and removes an uploaded media option for a single multiple choice question', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:question-media');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const component = fixture.componentInstance;
    const file = new File(['image-data'], 'lesson.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.onQuestionMediaSelected({ target: input } as unknown as Event);
    fixture.detectChanges();

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(component.questionMediaOption()).toEqual({
      name: 'lesson.png',
      size: file.size,
      type: 'image/png',
      previewUrl: 'blob:question-media',
      kind: 'image',
      file,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: 'lesson.png',
      mediaContentType: 'image/png',
      mediaSizeBytes: file.size,
    });
    expect(fixture.nativeElement.textContent).toContain('lesson.png');

    component.removeQuestionMedia();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:question-media');
    expect(component.questionMediaOption()).toBeNull();
  });

  it('opens the MathLive editor for a single multiple choice question and inserts LaTeX', () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Open MathLive editor"]')).toBeTruthy();

    component.setQuestionValue('Solve');
    component.openMathEditor();
    component.setMathEditorValue({ target: { value: 'x^2+1=0' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.questionForm.controls.question.value).toBe('Solve \\(x^2+1=0\\)');
    expect(component.showMathEditor()).toBe(false);
  });

  it('opens the MathLive editor with existing question LaTeX and replaces it after editing', () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.setQuestionValue('Solve \\(\\frac{155}{\\int_0^\\infty}\\placeholder{}\\)');
    component.openMathEditor('question');

    expect(component.mathEditorValue()).toBe('\\frac{155}{\\int_0^\\infty}\\placeholder{}');
    expect(component.mathEditorExistingExpression()).toBe('\\(\\frac{155}{\\int_0^\\infty}\\placeholder{}\\)');

    component.setMathEditorValue({ target: { value: '\\sqrt{4}=2' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.questionForm.controls.question.value).toBe('Solve \\(\\sqrt{4}=2\\)');
    expect(component.showMathEditor()).toBe(false);
  });

  it('opens the MathLive editor from Add Answer and inserts LaTeX into the answer', () => {
    const component = fixture.componentInstance;

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.openAnswerModal();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Open MathLive editor for answer"]')).toBeTruthy();

    component.setNewAnswer('Answer');
    component.openMathEditor('answer');
    component.setMathEditorValue({ target: { value: '\\frac{1}{2}' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.newAnswer()).toBe('Answer \\(\\frac{1}{2}\\)');
    expect(component.showMathEditor()).toBe(false);
    expect(component.showAnswerModal()).toBe(true);
  });

  it('opens the MathLive editor from an editable answer row and replaces answer LaTeX', () => {
    const component = fixture.componentInstance;
    const answer = {
      id: 'answer-latex',
      answer: '\\(\\exponentialE\\int_0^\\infty\\)',
      correct: true,
      description: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    component.selectedQuestionType.set('MULTIPLE_CHOICE');
    component.editingQuestionId.set('question-1');
    component.multipleChoiceAnswers.set([answer]);
    component.answerDrafts.set({
      [answer.id]: {
        answer: answer.answer,
        description: '',
        correct: true,
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label^="Open MathLive editor for answer:"]')).toBeTruthy();

    component.openAnswerDraftMathEditor(answer);
    expect(component.mathEditorValue()).toBe('\\exponentialE\\int_0^\\infty');
    expect(component.mathEditorAnswerDraftId()).toBe('answer-latex');

    component.setMathEditorValue({ target: { value: '\\sqrt{9}=3' } } as unknown as Event);
    component.insertMathExpression();

    expect(component.answerDraftValue(answer, 'answer')).toBe('\\(\\sqrt{9}=3\\)');
    expect(component.showMathEditor()).toBe(false);
  });

  it('saves an uploaded media option as the question when text is empty', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const createObjectURL = vi.fn().mockReturnValue('blob:question-media');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const component = fixture.componentInstance;
    const file = new File(['image-data'], 'lesson.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });

    component.selectQuestionType('Multiple Choice');
    component.selectMultipleChoiceMode('single');
    component.onQuestionMediaSelected({ target: input } as unknown as Event);
    await component.saveQuestion();

    expect(data.uploadCurriculumQuestionMedia).toHaveBeenCalledWith(file);
    expect(data.createCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      question: '',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: '',
      bloomId: null,
            difficultyId: null,
            skillId: null,
      weight: null,
      mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png',
      mediaFileName: 'media.png',
      mediaOriginalName: 'lesson.png',
      mediaContentType: 'image/png',
      mediaSizeBytes: 10,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('loads an existing question for edit and saves question and answer changes', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    vi.clearAllMocks();
    paramMap$.next(convertToParamMap({ id: 'subject-1', nodeId: 'lesson-1', questionId: 'question-1' }));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.listCurriculumQuestions).toHaveBeenCalledWith('subject-1', 'lesson-1');
    expect(component.isEditMode()).toBe(true);
    expect(component.questionForm.controls.question.value).toBe('What is the lesson title?');
    expect(component.questionForm.controls.type.value).toBe('MULTIPLE_CHOICE');
    expect(component.multipleChoiceAnswers()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Edit Question');

    component.questionForm.patchValue({ question: 'Updated question?' });
    component.setAnswerDraftValue('answer-1', 'answer', 'Updated answer');
    component.setAnswerDraftValue('answer-1', 'description', 'Updated description');
    component.setAnswerDraftCorrect('answer-1', false);
    await component.saveQuestion();

    expect(data.updateCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', {
      question: 'Updated question?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: 'Choose all valid answers',
      bloomId: 'bloom-understand',
              difficultyId: 'difficulty-medium',
              skillId: 'skill-1',
      weight: 12,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(data.updateCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', 'answer-1', {
      answer: 'Updated answer',
      correct: false,
      description: 'Updated description',
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });

  it('displays existing answer image media in edit mode and preserves it on save', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    data.listCurriculumQuestions.mockResolvedValueOnce([
      {
        id: 'question-1',
        question: 'Media answer question?',
        type: 'MULTIPLE_CHOICE',
        answer: null,
        description: null,
        mediaUrl: null,
        mediaFileName: null,
        mediaOriginalName: null,
        mediaContentType: null,
        mediaSizeBytes: null,
        answers: [
          {
            id: 'answer-1',
            answer: '',
            correct: true,
            description: null,
            mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/answer.png',
            mediaFileName: 'answer.png',
            mediaOriginalName: 'answer-image.png',
            mediaContentType: 'image/png',
            mediaSizeBytes: 25,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    data.updateCurriculumQuestion.mockResolvedValueOnce({
      id: 'question-1',
      question: 'Media answer question?',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
      answers: [
        {
          id: 'answer-1',
          answer: '',
          correct: true,
          description: null,
          mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/answer.png',
          mediaFileName: 'answer.png',
          mediaOriginalName: 'answer-image.png',
          mediaContentType: 'image/png',
          mediaSizeBytes: 25,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });

    vi.clearAllMocks();
    paramMap$.next(convertToParamMap({ id: 'subject-1', nodeId: 'lesson-1', questionId: 'question-1' }));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('td img') as HTMLImageElement | null;
    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toBe('http://localhost:18080/api/v1/public/tenant-curriculum-question-media/tenant-1/answer.png');
    expect(fixture.nativeElement.textContent).toContain('answer-image.png');

    await fixture.componentInstance.saveQuestion();

    expect(data.updateCurriculumQuestionAnswer).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1', 'answer-1', {
      answer: '',
      correct: true,
      description: '',
      mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/answer.png',
      mediaFileName: 'answer.png',
      mediaOriginalName: 'answer-image.png',
      mediaContentType: 'image/png',
      mediaSizeBytes: 25,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1', 'curriculum', 'lesson-1']);
  });
});
