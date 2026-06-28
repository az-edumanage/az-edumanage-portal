import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantExamsBasicEducationExamCreateComponent } from './tenant-exams-basic-education-exam-create.component';

const stages: EducationalStage[] = [
  {
    id: 'stage-primary',
    name: 'Primary Stage',
    code: 'PRI',
    order: 1,
    status: 'Active',
    countryId: 'country-eg',
    country: 'Egypt',
    countryCode: 'EG',
    gradeCount: 6,
    classCount: 12,
    description: 'Primary education stage',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const grades: Grade[] = [
  {
    id: 'grade-one',
    name: 'Grade One',
    description: 'First primary grade',
    level: 'Primary',
    stageId: 'stage-primary',
    countryId: 'country-eg',
    country: 'Egypt',
    countryCode: 'EG',
    studentCount: 24,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
  },
];

const subjects = [
  {
    id: 'subject-arabic',
    name: 'Arabic',
    description: null,
    stageId: 'stage-primary',
    stageName: 'Primary Stage',
    gradeId: 'subject-grade-one',
    gradeName: 'Grade One',
    assignedGroupsCount: 2,
    assignedTeachersCount: 1,
    totalStudentsCount: 24,
    groups: [],
    teachers: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

type ExamFixtureContext = 'basic' | 'university';

async function createFixture(mode?: 'create', context: ExamFixtureContext = 'basic', editExamId = ''): Promise<ComponentFixture<TenantExamsBasicEducationExamCreateComponent>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [TenantExamsBasicEducationExamCreateComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: mode ? { mode } : {},
            paramMap: {
              get: (key: string) => {
                if (context === 'university') {
                  if (key === 'universityId') {
                    return 'university-1';
                  }
                  if (key === 'collegeId') {
                    return 'college-1';
                  }
                }
                if (key === 'stageId') {
                  return 'stage-primary';
                }
                if (key === 'gradeId') {
                  return 'grade-one';
                }
                return null;
              },
            },
            queryParamMap: {
              get: (key: string) => {
                if (key === 'subjectId' && context === 'basic') {
                  return 'subject-arabic';
                }
                if (key === 'examId' && editExamId) {
                  return editExamId;
                }
                return null;
              },
            },
          },
        },
      },
      {
        provide: TenantEducationalStagesDataService,
        useValue: { listStages: vi.fn().mockResolvedValue(stages) },
      },
      {
        provide: TenantGradesDataService,
        useValue: {
          listGrades: vi.fn().mockResolvedValue(grades),
          toUserMessage: vi.fn().mockReturnValue('Unable to load grades.'),
        },
      },
      {
        provide: TenantSubjectsDataService,
        useValue: {
          listSubjects: vi.fn().mockResolvedValue(subjects),
          listBloomLevels: vi.fn().mockResolvedValue([
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
              id: 'difficulty-medium',
              code: 'medium',
              nameAr: 'متوسط',
              nameEn: 'Medium',
              descriptionAr: null,
              descriptionEn: null,
              difficultyOrder: 2,
            },
          ]),
          getSubjectCurriculum: vi.fn().mockResolvedValue({
            id: 'curriculum-root-one',
            label: 'Arabic curriculum',
            icon: 'menu_book',
            description: null,
            children: [
              {
                id: 'node-lesson-one',
                label: 'Lesson One',
                icon: 'menu_book',
                description: null,
                children: [],
              },
            ],
          }),
          listCurriculumQuestions: vi.fn().mockImplementation((_subjectId: string, nodeId: string) => Promise.resolve(nodeId === 'curriculum-root-one'
            ? [
                {
                  id: 'question-root-one',
                  curriculumNodeId: 'curriculum-root-one',
                  question: 'What is Arabic grammar?',
                  type: 'MULTIPLE_CHOICE',
                  answer: null,
                  description: null,
                  mediaUrl: null,
                  mediaFileName: null,
                  mediaOriginalName: null,
                  mediaContentType: null,
                  mediaSizeBytes: null,
                  bloomId: null,
                  difficultyId: null,
                  skillId: null,
                  questionSource: null,
                  answerExplanation: null,
                  tags: [],
                  answers: [
                    {
                      id: 'answer-1',
                      answer: 'Grammar answer',
                      correct: true,
                      description: null,
                      createdAt: '2026-01-01T00:00:00Z',
                      updatedAt: '2026-01-01T00:00:00Z',
                    },
                  ],
                  weight: 5,
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              ]
            : nodeId === 'node-lesson-one' ? [
                {
                  id: 'question-lesson-one',
                  question: 'What is the lesson topic?',
                  type: 'SHORT_ANSWER',
                  answer: 'Lesson topic',
                  description: null,
                  mediaUrl: null,
                  mediaFileName: null,
                  mediaOriginalName: null,
                  mediaContentType: null,
                  mediaSizeBytes: null,
                  bloomId: null,
                  difficultyId: null,
                  skillId: null,
                  questionSource: null,
                  answerExplanation: null,
                  tags: [],
                  answers: [],
                  weight: 3,
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              ] : [])),
          listCurriculumSkills: vi.fn().mockResolvedValue([
            {
              id: 'skill-reading',
              name: 'Critical reading',
              description: 'Identify the question concept.',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
          listBasicEducationExamQuestions: vi.fn().mockResolvedValue([
            {
              id: 'question-root-one',
              curriculumNodeId: 'curriculum-root-one',
              question: 'What is Arabic grammar?',
              type: 'MULTIPLE_CHOICE',
              answer: null,
              description: null,
              mediaUrl: null,
              mediaFileName: null,
              mediaOriginalName: null,
              mediaContentType: null,
              mediaSizeBytes: null,
              bloomId: 'bloom-understand',
              difficultyId: 'difficulty-medium',
              skillId: 'skill-reading',
              questionSource: 'Teacher-made',
              answerExplanation: 'Use the grammar rule from the lesson.',
              tags: ['امتحان شهر', 'اسئلة درس'],
              answers: [
                {
                  id: 'answer-1',
                  answer: 'Grammar answer',
                  correct: true,
                  description: null,
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              ],
              weight: 5,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            {
              id: 'question-lesson-one',
              curriculumNodeId: 'node-lesson-one',
              question: 'What is the lesson topic?',
              type: 'SHORT_ANSWER',
              answer: 'Lesson topic',
              description: null,
              mediaUrl: null,
              mediaFileName: null,
              mediaOriginalName: null,
              mediaContentType: null,
              mediaSizeBytes: null,
              bloomId: null,
              difficultyId: null,
              skillId: null,
              questionSource: null,
              answerExplanation: null,
              tags: [],
              answers: [],
              weight: 3,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
          listBasicEducationExamLinkedQuestions: vi.fn().mockResolvedValue([
            {
              id: 'question-root-one',
              curriculumNodeId: 'curriculum-root-one',
              question: 'What is Arabic grammar?',
              type: 'MULTIPLE_CHOICE',
              answer: null,
              description: null,
              mediaUrl: null,
              mediaFileName: null,
              mediaOriginalName: null,
              mediaContentType: null,
              mediaSizeBytes: null,
              bloomId: 'bloom-understand',
              difficultyId: 'difficulty-medium',
              skillId: 'skill-reading',
              questionSource: 'Teacher-made',
              answerExplanation: 'Use the grammar rule from the lesson.',
              tags: ['امتحان شهر', 'اسئلة درس'],
              answers: [
                {
                  id: 'answer-1',
                  answer: 'Grammar answer',
                  correct: true,
                  description: null,
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              ],
              weight: 5,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
          createEditableBasicEducationExamQuestionCopy: vi.fn().mockResolvedValue({
            id: 'editable-question-copy',
            curriculumNodeId: 'curriculum-root-one',
            question: 'What is Arabic grammar?',
            type: 'MULTIPLE_CHOICE',
            answer: null,
            description: null,
            mediaUrl: null,
            mediaFileName: null,
            mediaOriginalName: null,
            mediaContentType: null,
            mediaSizeBytes: null,
            bloomId: 'bloom-understand',
            difficultyId: 'difficulty-medium',
            skillId: 'skill-reading',
            questionSource: 'Teacher-made',
            answerExplanation: 'Use the grammar rule from the lesson.',
            tags: ['امتحان شهر', 'اسئلة درس'],
            answers: [],
            weight: 5,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          }),
          listBasicEducationExams: vi.fn().mockResolvedValue([
            {
              id: 'exam-term-one',
              stageId: 'stage-primary',
              gradeId: 'grade-one',
              subjectId: 'subject-arabic',
              title: 'First Term Exam',
              instructions: 'Term instructions',
              status: 'DRAFT',
              shuffleQuestions: true,
              showResultsImmediately: false,
              allowRetakes: false,
              questionCount: 1,
              createdAt: '2026-06-24T00:00:00Z',
              updatedAt: '2026-06-24T00:00:00Z',
            },
            {
              id: 'exam-monthly',
              stageId: 'stage-primary',
              gradeId: 'grade-one',
              subjectId: 'subject-arabic',
              title: 'Monthly Assessment',
              instructions: null,
              status: 'PUBLISHED',
              shuffleQuestions: true,
              showResultsImmediately: false,
              allowRetakes: false,
              questionCount: 2,
              createdAt: '2026-05-28T00:00:00Z',
              updatedAt: '2026-05-28T00:00:00Z',
            },
          ]),
          createBasicEducationExam: vi.fn().mockResolvedValue({
            id: 'exam-created',
            stageId: 'stage-primary',
            gradeId: 'grade-one',
            subjectId: 'subject-arabic',
            title: 'Science Midterm',
            instructions: null,
            status: 'DRAFT',
            shuffleQuestions: true,
            showResultsImmediately: false,
            allowRetakes: false,
            questionCount: 1,
            createdAt: '2026-06-26T00:00:00Z',
            updatedAt: '2026-06-26T00:00:00Z',
          }),
          updateBasicEducationExam: vi.fn().mockResolvedValue({
            id: 'exam-term-one',
            stageId: 'stage-primary',
            gradeId: 'grade-one',
            subjectId: 'subject-arabic',
            title: 'Updated Term Exam',
            instructions: 'Updated instructions',
            status: 'DRAFT',
            shuffleQuestions: false,
            showResultsImmediately: true,
            allowRetakes: true,
            questionCount: 1,
            createdAt: '2026-06-24T00:00:00Z',
            updatedAt: '2026-06-26T00:00:00Z',
          }),
          updateBasicEducationExamStatus: vi.fn().mockResolvedValue({
            id: 'exam-term-one',
            stageId: 'stage-primary',
            gradeId: 'grade-one',
            subjectId: 'subject-arabic',
            title: 'First Term Exam',
            instructions: 'Term instructions',
            status: 'PUBLISHED',
            shuffleQuestions: true,
            showResultsImmediately: false,
            allowRetakes: false,
            questionCount: 1,
            createdAt: '2026-06-24T00:00:00Z',
            updatedAt: '2026-06-26T00:00:00Z',
          }),
          deleteBasicEducationExam: vi.fn().mockResolvedValue(undefined),
          deleteBasicEducationExamQuestion: vi.fn().mockResolvedValue(undefined),
          toUserMessage: vi.fn().mockReturnValue('Unable to load subjects.'),
        },
      },
      {
        provide: TenantCollegesDataService,
        useValue: {
          getCollege: vi.fn().mockResolvedValue({
            id: 'college-1',
            universityId: 'university-1',
            universityName: 'Cairo University',
            name: 'Engineering',
            description: 'Engineering college',
            subjectCount: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          }),
        },
      },
      {
        provide: TenantUniversitySubjectsDataService,
        useValue: {
          listSubjects: vi.fn().mockResolvedValue([
            {
              id: 'subject-1',
              universityId: 'university-1',
              universityName: 'Cairo University',
              collegeId: 'college-1',
              collegeName: 'Engineering',
              name: 'Thermodynamics',
              description: 'Heat and energy',
              groupCount: 2,
              studentCount: 40,
              assignedTeachersCount: 0,
              teachers: [],
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
          toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TenantExamsBasicEducationExamCreateComponent);
  fixture.detectChanges();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  return fixture;
}

describe('TenantExamsBasicEducationExamCreateComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the grade exams list with a create exam button', async () => {
    const fixture = await createFixture();
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => anchor as HTMLAnchorElement);

    expect(text).toContain('Grade One Exams');
    expect(text).toContain('Arabic');
    expect(text).toContain('Review existing exams for Grade One, Arabic.');
    expect(text).toContain('Exams List');
    expect(text).toContain('First Term Exam');
    expect(text).toContain('Monthly Assessment');
    expect(text).toContain('Create Exam');
    expect(text).not.toContain('Exam Title');
    expect(links.some((anchor) =>
      anchor.pathname === '/tenant/exams/basic-education/stage-primary/grades/grade-one/create/new' &&
      anchor.search === '?subjectId=subject-arabic',
    )).toBe(true);
  });

  it('resets draft questions before opening a fresh create exam page', async () => {
    sessionStorage.setItem(
      'tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic',
      JSON.stringify(['question-root-one']),
    );
    const fixture = await createFixture();
    const createExamLink = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .find((anchor) =>
        anchor.textContent?.includes('Create Exam') &&
        anchor.pathname === '/tenant/exams/basic-education/stage-primary/grades/grade-one/create/new'
      ) as HTMLAnchorElement | undefined;

    expect(createExamLink?.search).toBe('?subjectId=subject-arabic');

    createExamLink?.addEventListener('click', (event) => event.preventDefault(), { once: true });
    createExamLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }));
    fixture.detectChanges();

    expect(sessionStorage.getItem('tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic')).toBe('[]');
  });

  it('filters the exams list by search text and status', async () => {
    const fixture = await createFixture();
    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const statusSelect = fixture.nativeElement.querySelector('select[aria-label="Filter exams by status"]') as HTMLSelectElement;

    expect(searchInput).not.toBeNull();
    expect(statusSelect).not.toBeNull();

    searchInput.value = 'monthly';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Monthly Assessment');
    expect(text).not.toContain('First Term Exam');

    statusSelect.value = 'Draft';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No exams match the filters');
    expect(text).not.toContain('Monthly Assessment');
    expect(text).not.toContain('First Term Exam');

    const clearButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Clear'),
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(searchInput.value).toBe('');
    expect(statusSelect.value).toBe('All');
    expect(text).toContain('Monthly Assessment');
    expect(text).toContain('First Term Exam');
  });

  it('opens a full drawer with linked exam questions when clicking an exam row', async () => {
    const fixture = await createFixture();
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
    };
    const examRow = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).find((row) =>
      (row as HTMLTableRowElement).textContent?.includes('First Term Exam'),
    ) as HTMLTableRowElement;

    examRow.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('#exam-questions-drawer') as HTMLElement;
    const text = fixture.nativeElement.textContent as string;
    expect(drawer).not.toBeNull();
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith(
      'stage-primary',
      'grade-one',
      'subject-arabic',
      'exam-term-one',
    );
    expect(text).toContain('Questions linked to this saved exam.');
    expect(text).toContain('What is Arabic grammar?');
    expect(text).toContain('Multiple Choice');
    expect(text).toContain('Arabic curriculum');
    expect(text).toContain('Medium');

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close exam questions"]') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#exam-questions-drawer')).toBeNull();
  });

  it('renders the create exam page with create and scope sections', async () => {
    const fixture = await createFixture('create');
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listCurriculumQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
      createBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => anchor as HTMLAnchorElement);
    const subjectSelect = fixture.nativeElement.querySelector('select[formcontrolname="subjectId"]') as HTMLSelectElement;

    expect(text).toContain('Create Exam');
    expect(text).toContain('Subject');
    expect(text).toContain('Exam Title');
    expect(text).not.toContain('Exam Date');
    expect(text).not.toContain('Duration (Minutes)');
    expect(text).toContain('Add Questions');
    expect(text).toContain('Questions will be added after exam setup');
    expect(text).not.toContain('1 saved question linked to Arabic.');
    expect(text).not.toContain('What is Arabic grammar?');
    expect(text).toContain('Exam Scope');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Grade One');
    expect(text).toContain('Arabic');
    expect(text).toContain('Grade Exams');
    expect(text).not.toContain('Exams List');
    expect(subjectSelect.disabled).toBe(true);
    expect(subjectSelect.value).toBe('subject-arabic');
    expect(subjectsData.listCurriculumQuestions).not.toHaveBeenCalled();
    const gradeExamsBreadcrumb = links.find((anchor) => anchor.textContent?.trim() === 'Grade Exams');
    expect(gradeExamsBreadcrumb?.pathname).toBe('/tenant/exams/basic-education/stage-primary/grades/grade-one/create');
    expect(gradeExamsBreadcrumb?.search).toBe('?subjectId=subject-arabic');
  });

  it('renders only questions selected through the exam draft flow', async () => {
    sessionStorage.setItem(
      'tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic',
      JSON.stringify(['question-root-one']),
    );
    const fixture = await createFixture('create');
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listCurriculumQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamQuestions: ReturnType<typeof vi.fn>;
    };
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('1 saved question linked to Arabic.');
    expect(text).toContain('What is Arabic grammar?');
    expect(text).toContain('Multiple Choice');
    expect(text).toContain('Arabic curriculum');
    expect(text).not.toContain('Questions will be added after exam setup');
    expect(subjectsData.listBasicEducationExamQuestions).toHaveBeenCalledWith('stage-primary', 'grade-one', 'subject-arabic');
    expect(subjectsData.listCurriculumQuestions).not.toHaveBeenCalled();
  });

  it('opens question details in a drawer when clicking a question row', async () => {
    sessionStorage.setItem(
      'tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic',
      JSON.stringify(['question-root-one']),
    );
    const fixture = await createFixture('create');
    const questionRow = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).find((row) =>
      (row as HTMLTableRowElement).textContent?.includes('What is Arabic grammar?'),
    ) as HTMLTableRowElement;

    questionRow.click();
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('#question-details-drawer') as HTMLElement;
    const text = fixture.nativeElement.textContent as string;
    expect(drawer).not.toBeNull();
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(text).toContain('Question details');
    expect(text).toContain('Answer overview');
    expect(text).toContain('Grammar answer');
    expect(text).toContain('Analytical Data');
    expect(text).toContain('Topic');
    expect(text).toContain("Bloom's Taxonomy");
    expect(text).toContain('2. Understanding');
    expect(text).toContain('Critical reading');
    expect(text).toContain('Medium');
    expect(text).not.toContain('bloom-understand');
    expect(text).not.toContain('skill-reading');
    expect(text).not.toContain('difficulty-medium');
    expect(text).toContain('Application Data');
    expect(text).toContain('Question Source');
    expect(text).toContain('Teacher-made');
    expect(text).toContain('Use the grammar rule from the lesson.');
    expect(text).toContain('امتحان شهر');
    expect(text).toContain('اسئلة درس');

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close question details"]') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#question-details-drawer')).toBeNull();
  });

  it('opens the exam edit question page with an editable exam-local copy from the table edit action', async () => {
    const fixture = await createFixture('create', 'basic', 'exam-term-one');
    const router = TestBed.inject(Router);
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      createEditableBasicEducationExamQuestionCopy: ReturnType<typeof vi.fn>;
    };
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const editButton = fixture.nativeElement.querySelector('button[aria-label="Edit question"]') as HTMLButtonElement;

    editButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.createEditableBasicEducationExamQuestionCopy).toHaveBeenCalledWith(
      'stage-primary',
      'grade-one',
      'subject-arabic',
      'exam-term-one',
      'question-root-one',
    );
    expect(navigateSpy).toHaveBeenCalledWith([
      '/tenant/exams/basic-education',
      'stage-primary',
      'grades',
      'grade-one',
      'create',
      'new',
      'subjects',
      'subject-arabic',
      'curriculum',
      'editQuestion',
      'editable-question-copy',
    ], { queryParams: { subjectId: 'subject-arabic', examId: 'exam-term-one' } });
    expect(JSON.parse(sessionStorage.getItem('tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic') ?? '[]'))
      .toEqual(['editable-question-copy']);
  });

  it('opens the exam add question page from Insert question with subject context', async () => {
    const fixture = await createFixture('create');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const addQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Add Questions'),
    ) as HTMLButtonElement;
    addQuestionsButton.click();
    fixture.detectChanges();

    const insertQuestionButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Insert question'),
    ) as HTMLButtonElement;
    insertQuestionButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith([
      '/tenant/exams/basic-education',
      'stage-primary',
      'grades',
      'subject-grade-one',
      'create',
      'new',
      'subjects',
      'subject-arabic',
      'curriculum',
      'addQuestion',
    ], { queryParams: { subjectId: 'subject-arabic' } });
  });

  it("opens a selectable basic questions drawer from Add from basic questions", async () => {
    const fixture = await createFixture("create");
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listCurriculumQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
      createBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
    const addQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add Questions"),
    ) as HTMLButtonElement;
    addQuestionsButton.click();
    fixture.detectChanges();

    const basicQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add from basic questions"),
    ) as HTMLButtonElement;
    basicQuestionsButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector("#basic-questions-drawer") as HTMLElement;
    const checkbox = drawer.querySelector("input[type=checkbox]") as HTMLInputElement;
    const searchInput = drawer.querySelector("input[type=search]") as HTMLInputElement;
    const typeFilter = drawer.querySelector("select[aria-label=\"Filter questions by type\"]") as HTMLSelectElement;
    let text = fixture.nativeElement.textContent as string;
    expect(drawer).not.toBeNull();
    expect(drawer.getAttribute("role")).toBe("dialog");
    expect(subjectsData.listCurriculumQuestions).toHaveBeenCalledWith("subject-arabic", "curriculum-root-one");
    expect(subjectsData.listCurriculumQuestions).toHaveBeenCalledWith("subject-arabic", "node-lesson-one");
    expect(subjectsData.listBasicEducationExamQuestions).not.toHaveBeenCalled();
    expect(text).toContain("Add from basic questions");
    expect(text).toContain("What is Arabic grammar?");
    expect(text).toContain("What is the lesson topic?");
    expect(text).toContain("Arabic curriculum / Lesson One");
    expect(searchInput).not.toBeNull();
    expect(typeFilter).not.toBeNull();
    expect(checkbox.checked).toBe(false);
    const addSelectedButton = Array.from(drawer.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add selected"),
    ) as HTMLButtonElement;
    expect(addSelectedButton.disabled).toBe(true);

    searchInput.value = "missing text";
    searchInput.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain("No basic questions match the filters");

    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    const visibleCheckbox = (fixture.nativeElement.querySelector("#basic-questions-drawer") as HTMLElement)
      .querySelector("input[type=checkbox]") as HTMLInputElement;
    visibleCheckbox.click();
    fixture.detectChanges();
    expect(addSelectedButton.disabled).toBe(false);

    addSelectedButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector("#basic-questions-drawer")).toBeNull();
    expect(subjectsData.createBasicEducationExam).toHaveBeenCalledWith(
      "stage-primary",
      "grade-one",
      "subject-arabic",
      expect.objectContaining({ title: "Arabic Exam", questionIds: ["question-root-one"] }),
    );
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith("stage-primary", "grade-one", "subject-arabic", "exam-created");
    expect(navigateSpy).toHaveBeenCalledWith(
      ["/tenant/exams/basic-education", "stage-primary", "grades", "grade-one", "create", "new"],
      { queryParams: { subjectId: "subject-arabic", examId: "exam-created" }, replaceUrl: true },
    );
    expect(fixture.componentInstance.examForm.controls.title.value).toBe("Arabic Exam");
    expect(sessionStorage.getItem("tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic")).toBe(JSON.stringify(["question-root-one"]));
    expect(text).toContain("1 saved question linked to Arabic.");
    expect(text).toContain("What is Arabic grammar?");
  });

  it("opens the same drawer from Add from questions bank and fetches bank questions", async () => {
    const fixture = await createFixture("create", "basic", "exam-term-one");
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listCurriculumQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
      updateBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    const router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
    subjectsData.listCurriculumQuestions.mockClear();
    subjectsData.listBasicEducationExamQuestions.mockClear();
    fixture.detectChanges();

    const addQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add Questions"),
    ) as HTMLButtonElement;
    addQuestionsButton.click();
    fixture.detectChanges();

    const questionsBankButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add from questions bank"),
    ) as HTMLButtonElement;
    questionsBankButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector("#basic-questions-drawer") as HTMLElement;
    expect(drawer).not.toBeNull();
    expect(subjectsData.listBasicEducationExamQuestions).toHaveBeenCalledWith("stage-primary", "grade-one", "subject-arabic");
    expect(subjectsData.listCurriculumQuestions).not.toHaveBeenCalled();
    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Add from questions bank");
    expect(text).toContain("Select questions from the tenant question bank");
    expect(text).toContain("What is Arabic grammar?");

    const addSelectedButton = Array.from(drawer.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add selected"),
    ) as HTMLButtonElement;
    expect(addSelectedButton.disabled).toBe(true);

    const lessonRow = Array.from(drawer.querySelectorAll("tbody tr")).find((row) =>
      (row as HTMLTableRowElement).textContent?.includes("What is the lesson topic?"),
    ) as HTMLTableRowElement;
    const lessonCheckbox = lessonRow.querySelector("input[type=checkbox]") as HTMLInputElement;
    lessonCheckbox.click();
    fixture.detectChanges();
    expect(addSelectedButton.disabled).toBe(false);

    addSelectedButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.updateBasicEducationExam).toHaveBeenCalledWith(
      "stage-primary",
      "grade-one",
      "subject-arabic",
      "exam-term-one",
      expect.objectContaining({ title: "First Term Exam", questionIds: ["question-root-one", "question-lesson-one"] }),
    );
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenLastCalledWith("stage-primary", "grade-one", "subject-arabic", "exam-term-one");
    expect(fixture.nativeElement.querySelector("#basic-questions-drawer")).toBeNull();
  });

  it("appends selected basic questions without removing existing questions", async () => {
    sessionStorage.setItem(
      "tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic",
      JSON.stringify(["question-root-one"]),
    );
    const fixture = await createFixture("create");
    fixture.componentInstance.examForm.controls.title.setValue("Science Midterm");
    fixture.detectChanges();
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      listBasicEducationExamQuestions: ReturnType<typeof vi.fn>;
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
      createBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    subjectsData.listBasicEducationExamLinkedQuestions.mockImplementation(() =>
      (subjectsData.listBasicEducationExamQuestions as unknown as () => Promise<unknown[]>)(),
    );
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain("1 saved question linked to Arabic.");
    expect(text).toContain("What is Arabic grammar?");

    const addQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add Questions"),
    ) as HTMLButtonElement;
    addQuestionsButton.click();
    fixture.detectChanges();

    const basicQuestionsButton = Array.from(fixture.nativeElement.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add from basic questions"),
    ) as HTMLButtonElement;
    basicQuestionsButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector("#basic-questions-drawer") as HTMLElement;
    const addSelectedButton = Array.from(drawer.querySelectorAll("button")).find((button) =>
      (button as HTMLButtonElement).textContent?.includes("Add selected"),
    ) as HTMLButtonElement;
    expect(addSelectedButton.disabled).toBe(true);

    const lessonRow = Array.from(drawer.querySelectorAll("tbody tr")).find((row) =>
      (row as HTMLTableRowElement).textContent?.includes("What is the lesson topic?"),
    ) as HTMLTableRowElement;
    const lessonCheckbox = lessonRow.querySelector("input[type=checkbox]") as HTMLInputElement;
    lessonCheckbox.click();
    fixture.detectChanges();
    expect(addSelectedButton.disabled).toBe(false);

    addSelectedButton.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector("#basic-questions-drawer")).toBeNull();
    expect(subjectsData.createBasicEducationExam).toHaveBeenCalledWith(
      "stage-primary",
      "grade-one",
      "subject-arabic",
      expect.objectContaining({ title: "Science Midterm", questionIds: ["question-root-one", "question-lesson-one"] }),
    );
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith("stage-primary", "grade-one", "subject-arabic", "exam-created");
    expect(navigateSpy).toHaveBeenCalledWith(
      ["/tenant/exams/basic-education", "stage-primary", "grades", "grade-one", "create", "new"],
      { queryParams: { subjectId: "subject-arabic", examId: "exam-created" }, replaceUrl: true },
    );
    expect(sessionStorage.getItem("tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic")).toBe(JSON.stringify(["question-root-one", "question-lesson-one"]));
    expect(text).toContain("2 saved questions linked to Arabic.");
    expect(text).toContain("What is Arabic grammar?");
    expect(text).toContain("What is the lesson topic?");
  });

  it("keeps cancel navigation inside the grade exams list", async () => {
    const fixture = await createFixture('create');
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => anchor as HTMLAnchorElement);

    expect(links.some((anchor) =>
      anchor.pathname === '/tenant/exams/basic-education/stage-primary/grades/grade-one/create' &&
      anchor.search === '?subjectId=subject-arabic',
    )).toBe(true);
  });

  it('renders the college exams list in university education context', async () => {
    const fixture = await createFixture(undefined, 'university');
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('Engineering Exams');
    expect(text).toContain('Exams List');
    expect(text).toContain('First Term Exam');
    expect(text).toContain('Monthly Assessment');
    expect(text).toContain('Create Exam');
    expect(text).not.toContain('Grade not found');
    expect(links).toContain('/tenant/exams/university-education/university-1/colleges/college-1/create/new');
  });

  it('shows a draft-ready message after submitting a valid exam shell', async () => {
    sessionStorage.setItem(
      'tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic',
      JSON.stringify(['question-root-one']),
    );
    const fixture = await createFixture('create');
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      createBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    component.examForm.patchValue({
      title: 'Science Midterm',
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(subjectsData.createBasicEducationExam).toHaveBeenCalledWith('stage-primary', 'grade-one', 'subject-arabic', {
      title: 'Science Midterm',
      instructions: null,
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
      questionIds: ['question-root-one'],
    });
    expect(sessionStorage.getItem('tenant.exam-draft.questions.basic.stage-primary.grade-one.subject-arabic')).toBe('[]');
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/tenant/exams/basic-education', 'stage-primary', 'grades', 'grade-one', 'create'],
      { queryParams: { subjectId: 'subject-arabic' } },
    );
  });

  it('opens the saved exam form from the list edit action', async () => {
    const fixture = await createFixture();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const editButton = fixture.nativeElement.querySelector('button[aria-label="Edit First Term Exam"]') as HTMLButtonElement;

    editButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/tenant/exams/basic-education', 'stage-primary', 'grades', 'grade-one', 'create', 'new'],
      { queryParams: { subjectId: 'subject-arabic', examId: 'exam-term-one' } },
    );
  });

  it('hydrates and updates a saved exam in edit mode', async () => {
    const fixture = await createFixture('create', 'basic', 'exam-term-one');
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      updateBasicEducationExam: ReturnType<typeof vi.fn>;
      listBasicEducationExamLinkedQuestions: ReturnType<typeof vi.fn>;
    };

    expect(component.examForm.controls.title.value).toBe('First Term Exam');
    expect(fixture.nativeElement.textContent).toContain('Save Exam');
    expect(subjectsData.listBasicEducationExamLinkedQuestions).toHaveBeenCalledWith(
      'stage-primary',
      'grade-one',
      'subject-arabic',
      'exam-term-one',
    );

    component.examForm.patchValue({
      title: 'Updated Term Exam',
      instructions: 'Updated instructions',
      shuffleQuestions: false,
      showResultsImmediately: true,
      allowRetakes: true,
    });

    await component.onSubmit();
    fixture.detectChanges();

    expect(subjectsData.updateBasicEducationExam).toHaveBeenCalledWith('stage-primary', 'grade-one', 'subject-arabic', 'exam-term-one', {
      title: 'Updated Term Exam',
      instructions: 'Updated instructions',
      shuffleQuestions: false,
      showResultsImmediately: true,
      allowRetakes: true,
      questionIds: ['question-root-one'],
    });
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/tenant/exams/basic-education', 'stage-primary', 'grades', 'grade-one', 'create'],
      { queryParams: { subjectId: 'subject-arabic' } },
    );
  });

  it('opens a confirmation modal before deleting a saved exam from the list action', async () => {
    const fixture = await createFixture();
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      deleteBasicEducationExam: ReturnType<typeof vi.fn>;
    };
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Delete First Term Exam"]') as HTMLButtonElement;

    deleteButton.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('#delete-exam-modal') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('Delete exam');
    expect(modal.textContent).toContain('First Term Exam');
    expect(subjectsData.deleteBasicEducationExam).not.toHaveBeenCalled();

    const confirmButton = Array.from(modal.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.includes('Delete exam')) as HTMLButtonElement;
    confirmButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.deleteBasicEducationExam).toHaveBeenCalledWith(
      'stage-primary',
      'grade-one',
      'subject-arabic',
      'exam-term-one',
    );
    expect(fixture.nativeElement.textContent).not.toContain('First Term Exam');
    expect(fixture.nativeElement.textContent).toContain('Monthly Assessment');
  });

  it('saves exam status changes from the list action', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const subjectsData = TestBed.inject(TenantSubjectsDataService) as unknown as {
      updateBasicEducationExamStatus: ReturnType<typeof vi.fn>;
    };

    await component.toggleExamStatus(component.exams()[0]);
    fixture.detectChanges();

    expect(subjectsData.updateBasicEducationExamStatus).toHaveBeenCalledWith(
      'stage-primary',
      'grade-one',
      'subject-arabic',
      'exam-term-one',
      { status: 'PUBLISHED' },
    );
    expect(component.exams()[0]?.status).toBe('Published');
  });
});
