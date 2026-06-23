import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantQuestionsBankBasicEducationGradesComponent } from './tenant-questions-bank-basic-education-grades.component';

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
  {
    id: 'grade-secondary',
    name: 'Secondary Grade',
    description: null,
    level: 'Secondary',
    stageId: 'stage-secondary',
    countryId: 'country-eg',
    country: 'Egypt',
    countryCode: 'EG',
    studentCount: 18,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
  },
];

describe('TenantQuestionsBankBasicEducationGradesComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankBasicEducationGradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankBasicEducationGradesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => key === 'stageId' ? 'stage-primary' : null } } },
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

    fixture = TestBed.createComponent(TenantQuestionsBankBasicEducationGradesComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders the selected stage breadcrumb and only grades related to that stage', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Questions Bank');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Grade One');
    expect(text).not.toContain('Secondary Grade');
  });

  it('opens the related subjects page when a grade row is clicked', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    row.click();

    expect(navigate).toHaveBeenCalledWith(['/tenant/questions-bank/basic-education', 'stage-primary', 'grades', 'grade-one']);
  });
});
