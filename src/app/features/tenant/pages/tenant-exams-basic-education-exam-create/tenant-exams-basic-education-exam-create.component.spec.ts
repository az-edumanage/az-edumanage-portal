import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
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

async function createFixture(mode?: 'create'): Promise<ComponentFixture<TenantExamsBasicEducationExamCreateComponent>> {
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
                if (key === 'stageId') {
                  return 'stage-primary';
                }
                if (key === 'gradeId') {
                  return 'grade-one';
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
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TenantExamsBasicEducationExamCreateComponent);
  fixture.detectChanges();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  return fixture;
}

describe('TenantExamsBasicEducationExamCreateComponent', () => {
  it('renders the grade exams list with a create exam button', async () => {
    const fixture = await createFixture();
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('Grade One Exams');
    expect(text).toContain('Exams List');
    expect(text).toContain('First Term Exam');
    expect(text).toContain('Monthly Assessment');
    expect(text).toContain('Create Exam');
    expect(text).not.toContain('Exam Title');
    expect(links).toContain('/tenant/exams/basic-education/stage-primary/grades/grade-one/create/new');
  });

  it('renders the create exam page with create and scope sections', async () => {
    const fixture = await createFixture('create');
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('Create Exam');
    expect(text).toContain('Exam Title');
    expect(text).toContain('Exam Scope');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Grade One');
    expect(text).not.toContain('Exams List');
    expect(links).toContain('/tenant/exams/basic-education/stage-primary/grades/grade-one/create');
  });

  it('keeps cancel navigation inside the grade exams list', async () => {
    const fixture = await createFixture('create');
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/basic-education/stage-primary/grades/grade-one/create');
  });

  it('shows a draft-ready message after submitting a valid exam shell', async () => {
    const fixture = await createFixture('create');
    const component = fixture.componentInstance;
    component.examForm.patchValue({
      title: 'Science Midterm',
      date: '2026-06-20',
      duration: 90,
    });

    component.onSubmit();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Exam draft is ready for Grade One.');
    expect(component.draftExamCount()).toBe(1);
  });
});
