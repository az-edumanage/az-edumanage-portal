import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubject, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantQuestionsBankSubjectQuestionsComponent } from './tenant-questions-bank-subject-questions.component';

const subject: TenantSubject = {
  id: 'subject-1',
  name: 'Mathematics',
  stageId: 'stage-1',
  stageName: 'Primary',
  gradeId: 'grade-1',
  gradeName: 'Grade One',
  assignedGroupsCount: 0,
  assignedTeachersCount: 0,
  totalStudentsCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  groups: [],
  teachers: [],
};

const curriculum: TenantSubjectCurriculumNode = {
  id: 'curriculum-root',
  label: 'Mathematics Curriculum',
  icon: 'folder',
  description: null,
  children: [
    {
      id: 'node-1',
      label: 'First Term',
      icon: 'menu_book',
      description: null,
      children: [
        {
          id: 'node-1-child',
          label: 'Edited Sub Directory',
          icon: 'folder',
          description: 'Updated child item',
          children: [],
        },
      ],
    },
    {
      id: 'node-2',
      label: 'Second Term',
      icon: 'menu_book',
      description: null,
      children: [],
    },
  ],
};

describe('TenantQuestionsBankSubjectQuestionsComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankSubjectQuestionsComponent>;
  let dataService: {
    getSubjectDetails: ReturnType<typeof vi.fn>;
    getSubjectCurriculum: ReturnType<typeof vi.fn>;
    listCurriculumQuestionsPage: ReturnType<typeof vi.fn>;
    deleteCurriculumQuestion: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dataService = {
      getSubjectDetails: vi.fn().mockResolvedValue(subject),
      getSubjectCurriculum: vi.fn().mockResolvedValue(curriculum),
      listCurriculumQuestionsPage: vi.fn().mockImplementation((_subjectId: string, nodeId: string) => Promise.resolve({
        content: nodeId === 'node-1'
          ? [
              {
                id: 'question-1',
                question: 'What is 2 + 2?',
                type: 'SHORT_ANSWER',
                answer: '4',
                description: 'Basic addition',
                mediaUrl: null,
                mediaFileName: null,
                mediaOriginalName: null,
                mediaContentType: null,
                mediaSizeBytes: null,
                bloomId: 'bloom-1',
                difficultyId: 'difficulty-1',
                weight: 5,
                skillId: 'skill-1',
                questionSource: 'Official previous exam',
                answerExplanation: 'Official answer key.',
                tags: ['exam'],
                answers: [],
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ]
          : nodeId === 'node-1-child'
            ? [
                {
                  id: 'question-child',
                  question: 'What is the child topic?',
                  type: 'SHORT_ANSWER',
                  answer: 'Topic',
                  description: 'Child question',
                  mediaUrl: null,
                  mediaFileName: null,
                  mediaOriginalName: null,
                  mediaContentType: null,
                  mediaSizeBytes: null,
                  bloomId: null,
                  difficultyId: null,
                  weight: null,
                  skillId: null,
                  questionSource: null,
                  answerExplanation: null,
                  tags: [],
                  answers: [],
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              ]
          : [
              {
                id: 'question-2',
                question: 'What is 3 + 3?',
                type: 'SHORT_ANSWER',
                answer: '6',
                description: 'More addition',
                mediaUrl: null,
                mediaFileName: null,
                mediaOriginalName: null,
                mediaContentType: null,
                mediaSizeBytes: null,
                bloomId: null,
                difficultyId: null,
                weight: null,
                skillId: null,
                questionSource: null,
                answerExplanation: null,
                tags: [],
                answers: [],
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 100,
      })),
      deleteCurriculumQuestion: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Unable to load questions.'),
    };

    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankSubjectQuestionsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                stageId: 'stage-1',
                gradeId: 'grade-1',
                id: 'subject-1',
                nodeId: 'node-1',
              }),
            },
          },
        },
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankSubjectQuestionsComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('lists subject questions and links add question to the selected curriculum item', () => {
    const text = fixture.nativeElement.textContent as string;
    const addLink = fixture.nativeElement.querySelector('a[href*="addQuestion"]') as HTMLAnchorElement;
    const breadcrumb = fixture.nativeElement.querySelector('nav[aria-label="Breadcrumb"]') as HTMLElement;
    const breadcrumbLinks = Array.from(breadcrumb.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(dataService.getSubjectDetails).toHaveBeenCalledWith('subject-1');
    expect(dataService.getSubjectCurriculum).toHaveBeenCalledWith('subject-1');
    expect(dataService.listCurriculumQuestionsPage).toHaveBeenCalledWith('subject-1', 'node-1', { page: 0, size: 100 });
    expect(dataService.listCurriculumQuestionsPage).toHaveBeenCalledWith('subject-1', 'node-1-child', { page: 0, size: 100 });
    expect(dataService.listCurriculumQuestionsPage).toHaveBeenCalledWith('subject-1', 'node-2', { page: 0, size: 100 });
    expect(text).toContain('Mathematics');
    expect(text).toContain('What is 2 + 2?');
    expect(text).toContain('Actions');
    expect(text).not.toContain('What is the child topic?');
    expect(text).not.toContain('What is 3 + 3?');
    expect(text).toContain('First Term');
    expect(text).toContain('Curriculum Content');
    expect(text).toContain('Edited Sub Directory');
    expect(text).toContain('Updated child item');
    expect(breadcrumb.textContent).toContain('Questions Bank');
    expect(breadcrumb.textContent).toContain('Basic Education');
    expect(breadcrumb.textContent).toContain('Primary');
    expect(breadcrumb.textContent).toContain('Grade One');
    expect(breadcrumb.textContent).toContain('Mathematics');
    expect(breadcrumb.textContent).toContain('Curriculum');
    expect(breadcrumb.textContent).toContain('First Term');
    expect(breadcrumbLinks).toEqual([
      '/tenant/questions-bank',
      '/tenant/questions-bank/basic-education',
      '/tenant/questions-bank/basic-education/stage-1',
      '/tenant/questions-bank/basic-education/stage-1/grades/grade-1',
      '/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum',
      '/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum',
    ]);
    expect(addLink.pathname).toBe('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/node-1/addQuestion');
    expect((fixture.nativeElement.querySelector('a[aria-label="Edit question What is 2 + 2?"]') as HTMLAnchorElement).pathname)
      .toBe('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/node-1/editQuestion/question-1');
  });

  it('opens overview when a question row is clicked and deletes from the backend with the delete icon', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr[role="button"]') as HTMLTableRowElement;
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Delete question What is 2 + 2?"]') as HTMLButtonElement;

    row.click();
    expect(navigate).toHaveBeenCalledWith([
      '/tenant/questions-bank/basic-education',
      'stage-1',
      'grades',
      'grade-1',
      'subjects',
      'subject-1',
      'curriculum',
      'node-1',
      'questions',
      'question-1',
    ]);

    deleteButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledWith('Delete question "What is 2 + 2?"?');
    expect(dataService.deleteCurriculumQuestion).toHaveBeenCalledWith('subject-1', 'node-1', 'question-1');
    expect(fixture.nativeElement.textContent).not.toContain('What is 2 + 2?');
  });

  it('shows all questions when All Item is selected', async () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(fixture.nativeElement.textContent).toContain('What is 2 + 2?');
    expect(fixture.nativeElement.textContent).not.toContain('What is 3 + 3?');

    select.value = '__all__';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const addLink = fixture.nativeElement.querySelector('a[href*="/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum"]') as HTMLAnchorElement;
    expect(text).toContain('All Item');
    expect(text).toContain('What is 2 + 2?');
    expect(text).toContain('What is the child topic?');
    expect(text).toContain('What is 3 + 3?');
    expect(addLink.pathname).toBe('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum');
  });
});
