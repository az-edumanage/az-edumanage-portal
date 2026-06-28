import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';
import { TenantSubjectCurriculumDetailsComponent } from './tenant-subject-curriculum-details.component';

describe('TenantSubjectCurriculumDetailsComponent', () => {
  let fixture: ComponentFixture<TenantSubjectCurriculumDetailsComponent>;
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
        description: 'Term content',
        children: [
          {
            id: 'lesson-1',
            label: 'Lesson 1',
            icon: 'description',
            description: 'Intro lesson',
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
    listCurriculumQuestionsPage: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'question-1',
          question: 'What is the lesson title?',
          type: 'MULTIPLE_CHOICE',
          answer: null,
          description: 'Choose all valid answers',
          mediaUrl: '/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png',
          mediaFileName: 'media.png',
          mediaOriginalName: 'lesson.png',
          mediaContentType: 'image/png',
          mediaSizeBytes: 10,
          answers: [
            {
              id: 'answer-1',
              answer: 'Lesson 1',
              correct: true,
              description: 'Intro answer',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            {
              id: 'answer-2',
              answer: 'Lesson 2',
              correct: false,
              description: 'Wrong option',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      totalElements: 21,
      totalPages: 3,
      page: 0,
      size: 10,
    }),
    listCurriculumMaterialFolders: vi.fn().mockResolvedValue([
      {
        id: 'folder-1',
        name: 'Lecture Files',
        description: 'Slides and references',
        fileTypes: ['pdf', 'word', 'powerpoint', 'image'],
        filesCount: 4,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    createCurriculumMaterialFolder: vi.fn().mockResolvedValue({
      id: 'folder-2',
      name: 'Homework',
      description: null,
      fileTypes: [],
      filesCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    updateCurriculumMaterialFolder: vi.fn().mockResolvedValue({
      id: 'folder-1',
      name: 'Updated Files',
      description: 'Updated',
      fileTypes: ['pdf'],
      filesCount: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    deleteCurriculumMaterialFolder: vi.fn().mockResolvedValue(undefined),
    listCurriculumSkills: vi.fn().mockResolvedValue([]),
    createCurriculumSkill: vi.fn().mockResolvedValue({
      id: 'skill-1',
      name: 'Critical reading',
      description: 'Identify arguments and supporting evidence.',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    updateCurriculumSkill: vi.fn().mockResolvedValue({
      id: 'skill-1',
      name: 'Analytical reading',
      description: 'Identify arguments and supporting evidence.',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    deleteCurriculumSkill: vi.fn().mockResolvedValue(undefined),
    deleteCurriculumQuestion: vi.fn().mockResolvedValue(undefined),
    mediaUrlToAbsolute: vi.fn((url: string | null | undefined) => url ? `http://localhost:18080${url}` : null),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };
  const i18n = {
    language: signal<'en' | 'ar'>('en'),
  };
  const questionTypeSettings = {
    listQuestionTypes: vi.fn().mockResolvedValue([
      { id: 'type-1', name: 'Multiple Choice', code: 'MULTIPLE_CHOICE', displayOrder: 10 },
      { id: 'type-2', name: 'Essay', code: 'ESSAY', displayOrder: 20 },
    ]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectCurriculumDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectDetailsFacade, useValue: facade },
        { provide: TenantSubjectsDataService, useValue: data },
        { provide: TenantQuestionTypeSettingsService, useValue: questionTypeSettings },
        { provide: I18nService, useValue: i18n },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'subject-1', nodeId: 'lesson-1' })),
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectCurriculumDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    i18n.language.set('en');
  });

  it('renders the curriculum details breadcrumb with the selected node path', () => {
    let text = fixture.nativeElement.textContent as string;

    expect(facade.loadSubject).toHaveBeenCalledWith('subject-1');
    expect(data.getSubjectCurriculum).toHaveBeenCalledWith('subject-1');
    expect(data.listCurriculumQuestionsPage).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      search: '',
      type: '',
      page: 0,
      size: 10,
    });
    expect(questionTypeSettings.listQuestionTypes).toHaveBeenCalled();
    expect(text).toContain('Subject');
    expect(text).toContain('Subject Details');
    expect(text).toContain('Curriculum');
    expect(text).toContain('Arabic Curriculum');
    expect(text).toContain('First Term');
    expect(text).toContain('Lesson 1');
    expect(text).toContain('Questions');
    expect(text).toContain('Material');
    expect(text).toContain('Skills');
    expect(text).toContain('Add Question');
    expect(text).toContain('Advanced Filters');
    expect(text).toContain('Showing 1-1 of 21 questions');
    expect(text).toContain('Page 1 of 3');
    expect(text).toContain('Question');
    expect(text).toContain('Type');
    expect(text).toContain('Description');
    expect(text).toContain('Actions');
    expect(text).toContain('What is the lesson title?');
    expect(text).not.toContain('lesson.png');
    expect(text).toContain('Multiple Choice');
    expect(text).not.toContain('MULTIPLE_CHOICE');
    expect(text).toContain('Choose all valid answers');
    expect(text).not.toContain('No questions yet.');
    expect(text).not.toContain('Direct Sub Items');
    expect(text).not.toContain('Intro lesson');

    const questionTreeTable = fixture.debugElement.query(By.css('.curriculum-details-tree-table'));
    expect(questionTreeTable).toBeTruthy();
    expect(questionTreeTable.attributes['role']).toBe('treegrid');
    expect(questionTreeTable.attributes['aria-label']).toBe('Questions tree table');

    const imagePreview = fixture.debugElement.query(By.css('.curriculum-question-image-preview'));
    expect(imagePreview.nativeElement.textContent).not.toContain('lesson.png');
    expect(imagePreview.query(By.css('img')).nativeElement.getAttribute('src')).toBe('http://localhost:18080/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png');

    imagePreview.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('button[aria-label="Close image preview"]'))).toBeTruthy();
    const previewModalImage = fixture.debugElement.query(By.css('.curriculum-image-modal-body img'));
    expect(previewModalImage.nativeElement.getAttribute('src')).toBe('http://localhost:18080/api/v1/public/tenant-curriculum-question-media/tenant-1/media.png');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.curriculum-image-modal'))).toBeNull();

    const tabs = fixture.debugElement.queryAll(By.css('.curriculum-details-tab'));
    expect(tabs[0].classes['curriculum-details-tab--active']).toBe(true);
    expect(tabs[0].attributes['aria-selected']).toBe('true');
    expect(tabs[0].attributes['aria-controls']).toBe('curriculum-details-questions-panel');
    expect(tabs[1].attributes['aria-selected']).toBe('false');
    expect(tabs[1].attributes['aria-controls']).toBe('curriculum-details-material-panel');
    expect(tabs[2].attributes['aria-selected']).toBe('false');
    expect(tabs[2].attributes['aria-controls']).toBe('curriculum-details-skills-panel');

    fixture.componentInstance.toggleQuestion('question-1');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Correct answer');
    expect(text).toContain('Wrong answer');

    const correctBadge = fixture.debugElement.query(By.css('.curriculum-question-type-badge--correct'));
    const wrongBadge = fixture.debugElement.query(By.css('.curriculum-question-type-badge--wrong'));
    expect(correctBadge.nativeElement.textContent).toContain('Correct answer');
    expect(wrongBadge.nativeElement.textContent).toContain('Wrong answer');

    const editLink = fixture.debugElement.query(By.css('a[aria-label="Edit What is the lesson title?"]'));
    expect(editLink.nativeElement.getAttribute('href')).toBe('/tenant/subjects/subject-1/curriculum/lesson-1/editQuestion/question-1');
  });

  it('renders saved LaTeX question text with MathLive instead of raw delimiters', () => {
    fixture.componentInstance.questionRows.set([
      {
        id: 'math-question',
        question: 'Solve \\(\\colorbox{#fbbbb6}{$ \\dfrac42 $}=2\\)',
        type: 'MULTIPLE_CHOICE',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
    ]);
    fixture.detectChanges();

    const mathField = fixture.debugElement.query(By.css('math-field.curriculum-question-math'));
    expect(mathField).toBeTruthy();
    expect(mathField.nativeElement.value).toBe('\\colorbox{#fbbbb6}{$ \\dfrac42 $}=2');
    expect(fixture.nativeElement.textContent).toContain('Solve');
  });

  it('switches between Questions and Material tab panels', async () => {
    const tabs = fixture.debugElement.queryAll(By.css('.curriculum-details-tab'));

    tabs[1].triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(data.listCurriculumMaterialFolders).toHaveBeenCalledWith('subject-1', 'lesson-1');
    expect(tabs[1].classes['curriculum-details-tab--active']).toBe(true);
    expect(tabs[1].attributes['aria-selected']).toBe('true');
    expect(fixture.debugElement.query(By.css('#curriculum-details-material-panel'))).toBeTruthy();
    expect(text).toContain('Create Folder');
    expect(text).toContain('Lecture Files');
    expect(text).toContain('Slides and references');
    expect(text).toContain('4 files');
    expect(fixture.debugElement.query(By.css('.curriculum-material-folder-card'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.curriculum-material-folder-title h5')).nativeElement.textContent).toContain('Lecture Files');
    expect(fixture.debugElement.queryAll(By.css('.curriculum-material-folder-cover-slot mat-icon')).map((icon) => icon.nativeElement.textContent.trim()))
      .toEqual(['picture_as_pdf', 'description', 'slideshow', 'add']);
    const showLink = fixture.debugElement.query(By.css('a[aria-label="Show Lecture Files"]'));
    expect(showLink.nativeElement.getAttribute('href')).toBe('/tenant/subjects/subject-1/curriculum/lesson-1/material/folder-1');
    expect(fixture.debugElement.query(By.css('#curriculum-details-questions-panel'))).toBeNull();
  });

  it('adds, edits, and deletes skills from the Skills tab panel', async () => {
    const tabs = fixture.debugElement.queryAll(By.css('.curriculum-details-tab'));

    tabs[2].triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent as string;

    expect(tabs[2].classes['curriculum-details-tab--active']).toBe(true);
    expect(tabs[2].attributes['aria-selected']).toBe('true');
    expect(fixture.debugElement.query(By.css('#curriculum-details-skills-panel'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#curriculum-details-questions-panel'))).toBeNull();
    expect(fixture.debugElement.query(By.css('#curriculum-details-material-panel'))).toBeNull();
    expect(text).toContain('No skills yet');

    const addButton = fixture.debugElement.query(By.css('#curriculum-details-skills-panel .curriculum-details-primary-action'));
    addButton.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Add new skill');

    const nameInput = fixture.debugElement.query(By.css('.curriculum-skill-modal input'));
    const descriptionInput = fixture.debugElement.query(By.css('.curriculum-skill-modal textarea'));
    nameInput.nativeElement.value = 'Critical reading';
    nameInput.triggerEventHandler('input', { target: nameInput.nativeElement });
    descriptionInput.nativeElement.value = 'Identify arguments and supporting evidence.';
    descriptionInput.triggerEventHandler('input', { target: descriptionInput.nativeElement });
    fixture.detectChanges();

    data.listCurriculumSkills.mockResolvedValueOnce([
      {
        id: 'skill-1',
        name: 'Critical reading',
        description: 'Identify arguments and supporting evidence.',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    const saveButton = fixture.debugElement.query(By.css('.curriculum-skill-modal .curriculum-details-modal-primary'));
    saveButton.triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.createCurriculumSkill).toHaveBeenCalledWith('subject-1', 'lesson-1', {
      name: 'Critical reading',
      description: 'Identify arguments and supporting evidence.',
    });
    text = fixture.nativeElement.textContent as string;
    expect(data.listCurriculumSkills).toHaveBeenLastCalledWith('subject-1', 'lesson-1');
    expect(text).toContain('Critical reading');
    expect(text).toContain('Identify arguments and supporting evidence.');
    expect(fixture.debugElement.query(By.css('.curriculum-skills-table'))).toBeTruthy();

    const editButton = fixture.debugElement.query(By.css('button[aria-label="Edit Critical reading"]'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const editNameInput = fixture.debugElement.query(By.css('.curriculum-skill-modal input'));
    editNameInput.nativeElement.value = 'Analytical reading';
    editNameInput.triggerEventHandler('input', { target: editNameInput.nativeElement });
    data.listCurriculumSkills.mockResolvedValueOnce([
      {
        id: 'skill-1',
        name: 'Analytical reading',
        description: 'Identify arguments and supporting evidence.',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    fixture.debugElement.query(By.css('.curriculum-skill-modal .curriculum-details-modal-primary')).triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.updateCurriculumSkill).toHaveBeenCalledWith('subject-1', 'lesson-1', 'skill-1', {
      name: 'Analytical reading',
      description: 'Identify arguments and supporting evidence.',
    });
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Analytical reading');
    expect(text).not.toContain('Critical reading');

    const deleteButton = fixture.debugElement.query(By.css('button[aria-label="Delete Analytical reading"]'));
    data.listCurriculumSkills.mockResolvedValueOnce([]);
    deleteButton.triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.deleteCurriculumSkill).toHaveBeenCalledWith('subject-1', 'lesson-1', 'skill-1');
    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No skills yet');
    expect(fixture.debugElement.query(By.css('.curriculum-skills-table'))).toBeNull();
  });

  it('reloads questions with search, type filter, and pagination', async () => {
    data.listCurriculumQuestionsPage.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 10,
    });

    const searchInput = fixture.debugElement.query(By.css('.curriculum-details-search input'));
    searchInput.nativeElement.value = 'water';
    searchInput.triggerEventHandler('input', { target: searchInput.nativeElement });
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.listCurriculumQuestionsPage).toHaveBeenLastCalledWith('subject-1', 'lesson-1', {
      search: 'water',
      type: '',
      page: 0,
      size: 10,
    });

    const filterButton = fixture.debugElement.query(By.css('.curriculum-details-filter-btn'));
    filterButton.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    const essayOption = fixture.debugElement
      .queryAll(By.css('.curriculum-details-filter-option'))
      .find((option) => option.nativeElement.textContent.includes('Essay'));
    expect(essayOption).toBeTruthy();

    data.listCurriculumQuestionsPage.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 10,
    });
    essayOption?.triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.listCurriculumQuestionsPage).toHaveBeenLastCalledWith('subject-1', 'lesson-1', {
      search: 'water',
      type: 'ESSAY',
      page: 0,
      size: 10,
    });
  });

  it('renders multiple choice type in Arabic when Arabic language is active', () => {
    fixture.componentInstance.questionRows.set([
      {
        id: 'true-false-question',
        question: 'True false question?',
        type: 'TRUE_FALSE',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
      {
        id: 'short-answer-question',
        question: 'Short answer question?',
        type: 'SHORT_ANSWER',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
      {
        id: 'essay-question',
        question: 'Essay question?',
        type: 'ESSAY',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
      {
        id: 'mcq-question',
        question: 'MCQ question?',
        type: 'MCQ',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
      {
        id: 'multiple-choice-question',
        question: 'Multiple choice question?',
        type: 'MULTIPLE_CHOICE',
        answerState: null,
        description: '',
        mediaUrl: null,
        mediaName: null,
        mediaType: null,
        canDelete: true,
        children: [],
      },
    ]);
    i18n.language.set('ar');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('السؤال');
    expect(text).toContain('النوع');
    expect(text).toContain('الوصف');
    expect(text).toContain('الاجرائات');
    expect(text).toContain('اضافة سؤال');
    expect(text).not.toContain('Add Question');
    expect(text).toContain('الملحقات');
    expect(text).toContain('المهارات');
    expect(text).toContain('عناصر المنهج');
    expect(text).toContain('الفلتر');
    expect(text).toContain('اختيار من متعدد');
    expect(text).toContain('صح و خطأ');
    expect(text).toContain('اجابه قصيرة');
    expect(text).toContain('مقال');
    expect(text).toContain('اختيار اجابة واحدة');
    expect(text).not.toContain('MULTIPLE_CHOICE');
    expect(text).not.toContain('TRUE_FALSE');
    expect(text).not.toContain('SHORT_ANSWER');
    expect(text).toContain('المادة');
    expect(text).toContain('تفاصيل المادة');
    expect(text).toContain('المنهج');
    expect(text).toContain('منهج Arabic');

    const toggleIcon = fixture.debugElement.query(By.css('.curriculum-question-tree-toggle mat-icon'));
    expect(toggleIcon.nativeElement.textContent.trim()).toBe('chevron_left');
    const breadcrumbIcons = fixture.debugElement.queryAll(By.css('.curriculum-details-breadcrumb mat-icon'));
    expect(breadcrumbIcons.length).toBeGreaterThan(0);
    expect(breadcrumbIcons.every((icon) => icon.nativeElement.textContent.trim() === 'chevron_left')).toBe(true);
    const searchInput = fixture.debugElement.query(By.css('.curriculum-details-search input')).nativeElement as HTMLInputElement;
    expect(searchInput.placeholder).toBe('بحث الاسئلة');

    const actionsHeader = fixture.debugElement.query(By.css('th.curriculum-details-actions-column'));
    const actionsCell = fixture.debugElement.query(By.css('td.curriculum-details-actions-column'));
    expect(actionsHeader.nativeElement.textContent).toContain('الاجرائات');
    expect(actionsCell).toBeTruthy();
  });

  it('confirms and deletes a question through the backend', async () => {
    const component = fixture.componentInstance;
    const deleteButtons = fixture.debugElement.queryAll(By.css('.curriculum-details-table-action--danger'));

    expect(deleteButtons.length).toBe(1);

    deleteButtons[0].triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Delete Question');
    expect(fixture.nativeElement.textContent).toContain('What is the lesson title?');

    data.listCurriculumQuestionsPage.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 10,
    });

    const confirmButton = fixture.debugElement.query(By.css('.curriculum-details-modal-danger'));
    confirmButton.triggerEventHandler('click');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.deleteCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'lesson-1', 'question-1');
    expect(component.questionRows()).toEqual([]);
    expect(component.questionPendingDelete()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No questions yet.');
  });
});
