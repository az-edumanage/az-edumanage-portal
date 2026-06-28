import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantQuestionsBankQuestionOverviewComponent } from './tenant-questions-bank-question-overview.component';

describe('TenantQuestionsBankQuestionOverviewComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankQuestionOverviewComponent>;
  const dataService = {
    getSubjectDetails: vi.fn().mockResolvedValue({
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
    }),
    getSubjectCurriculum: vi.fn().mockResolvedValue({
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
          children: [],
        },
      ],
    }),
    listCurriculumQuestions: vi.fn().mockResolvedValue([
      {
        id: 'question-1',
        question: 'What is 2 + 2?',
        type: 'SHORT_ANSWER',
        answer: '4',
        description: 'Basic addition',
        mediaUrl: '/api/v1/public/question.png',
        mediaFileName: 'question.png',
        mediaOriginalName: 'addition.png',
        mediaContentType: 'image/png',
        mediaSizeBytes: 42,
        bloomId: 'bloom-remember',
        difficultyId: 'difficulty-easy',
        weight: 5,
        skillId: 'skill-arithmetic',
        questionSource: 'Official previous exam',
        answerExplanation: 'The official answer key is 4.',
        tags: ['exam', 'addition'],
        answers: [
          {
            id: 'answer-1',
            answer: '4',
            correct: true,
            description: 'Correct answer',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ]),
    listBloomLevels: vi.fn().mockResolvedValue([
      {
        id: 'bloom-remember',
        code: 'REMEMBER',
        nameAr: 'تذكر',
        nameEn: 'Remember',
        descriptionAr: null,
        descriptionEn: null,
        levelOrder: 1,
      },
    ]),
    listQuestionDifficulties: vi.fn().mockResolvedValue([
      {
        id: 'difficulty-easy',
        code: 'EASY',
        nameAr: 'سهل',
        nameEn: 'Easy',
        descriptionAr: null,
        descriptionEn: null,
        difficultyOrder: 1,
      },
    ]),
    listCurriculumSkills: vi.fn().mockResolvedValue([
      {
        id: 'skill-arithmetic',
        name: 'Arithmetic fluency',
        description: 'Adds small numbers accurately.',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };
  const questionTypeSettings = {
    listQuestionTypes: vi.fn().mockResolvedValue([
      {
        id: 'question-type-short-answer',
        name: 'Short answer',
        code: 'SHORT_ANSWER',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankQuestionOverviewComponent],
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
                questionId: 'question-1',
              }),
            },
          },
        },
        { provide: TenantSubjectsDataService, useValue: dataService },
        { provide: TenantQuestionTypeSettingsService, useValue: questionTypeSettings },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankQuestionOverviewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('displays all saved question metadata for the overview page', () => {
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(dataService.listCurriculumQuestions).toHaveBeenCalledWith('subject-1', 'node-1');
    expect(text).toContain('What is 2 + 2?');
    expect(text).toContain('Question Metadata');
    expect(text).toContain('Application Data');
    expect(text).toContain('Media');
    expect(text).toContain('Answers');
    expect(text).toContain('Short answer');
    expect(text).toContain('Basic addition');
    expect(text).toContain('1. Remember');
    expect(text).toContain('Easy');
    expect(text).toContain('Arithmetic fluency');
    expect(text).toContain('Official previous exam');
    expect(text).toContain('The official answer key is 4.');
    expect(text).toContain('/api/v1/public/question.png');
    expect(text).toContain('exam');
    expect(text).toContain('addition');
    expect(text).toContain('Correct answer');
    expect(text).not.toContain('bloom-remember');
    expect(text).not.toContain('difficulty-easy');
    expect(text).not.toContain('skill-arithmetic');
    expect(links).toContain('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/node-1/editQuestion/question-1');
  });
});
