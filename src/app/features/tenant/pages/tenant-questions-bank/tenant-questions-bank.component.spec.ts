import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantQuestionsBankComponent } from './tenant-questions-bank.component';

describe('TenantQuestionsBankComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankComponent>;
  const dataService = {
    getQuestionBankOverview: vi.fn().mockResolvedValue({
      basicEducationQuestions: 12,
      universityEducationQuestions: 8,
      stagesCount: 3,
      universitiesCount: 2,
      tags: [
        { name: 'algebra', totalQuestions: 4 },
        { name: 'exam', totalQuestions: 2 },
      ],
      taggedQuestions: [],
    }),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders the overview and two education question bank track cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(dataService.getQuestionBankOverview).toHaveBeenCalledWith(undefined);
    expect(text).toContain('Questions Bank');
    expect(text).toContain('Track coverage');
    expect(text).toContain('Question mix');
    expect(text).toContain('Question tags');
    expect(text).toContain('12');
    expect(text).toContain('8');
    expect(text).toContain('Stages');
    expect(text).toContain('Universities');
    expect(text).toContain('Basic Education');
    expect(text).toContain('University Education');
    expect(text).toContain('algebra');
  });

  it('links basic education to the subject question bank route', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/questions-bank/basic-education');
  });

  it('links university education to the subject question bank route', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/questions-bank/university-education');
  });

  it('loads and displays questions when a tag is selected', async () => {
    dataService.getQuestionBankOverview.mockResolvedValueOnce({
      basicEducationQuestions: 12,
      universityEducationQuestions: 8,
      stagesCount: 3,
      universitiesCount: 2,
      tags: [
        { name: 'algebra', totalQuestions: 4 },
      ],
      taggedQuestions: [
        {
          id: 'question-1',
          question: 'Solve x + 2 = 4',
          type: 'SHORT_ANSWER',
          subjectId: 'subject-1',
          subjectName: 'Mathematics',
          curriculumNodeId: 'node-1',
          curriculumNodeName: 'Linear equations',
          track: 'BASIC_EDUCATION',
          stageId: 'stage-1',
          stageName: 'Primary',
          gradeId: 'grade-1',
          gradeName: 'Grade One',
          universityId: null,
          universityName: null,
          tags: ['algebra'],
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const tagButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('algebra')) as HTMLButtonElement;
    tagButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const questionLinks = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(dataService.getQuestionBankOverview).toHaveBeenLastCalledWith('algebra');
    expect(text).toContain('#algebra');
    expect(text).toContain('4 saved questions match this tag.');
    expect(text).toContain('Solve x + 2 = 4');
    expect(text).toContain('Mathematics');
    expect(questionLinks).toContain('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/node-1/questions/question-1');
  });
});
