import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { TenantSubject } from '../../models/tenant-subjects.models';
import { TenantExamsBasicEducationSubjectsComponent } from './tenant-exams-basic-education-subjects.component';

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

const subjects: TenantSubject[] = [
  {
    id: 'subject-science',
    name: 'Science',
    stageId: 'stage-primary',
    stageName: 'Primary Stage',
    gradeId: 'grade-one',
    gradeName: 'Grade One',
    assignedGroupsCount: 2,
    assignedTeachersCount: 1,
    totalStudentsCount: 24,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    teachers: [],
  },
  {
    id: 'subject-math',
    name: 'Math',
    stageId: 'stage-primary',
    stageName: 'Primary Stage',
    gradeId: 'grade-one',
    gradeName: 'Grade One',
    assignedGroupsCount: 3,
    assignedTeachersCount: 2,
    totalStudentsCount: 24,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    teachers: [],
  },
  {
    id: 'subject-history',
    name: 'History',
    stageId: 'stage-primary',
    stageName: 'Primary Stage',
    gradeId: 'grade-one',
    gradeName: 'Grade One',
    assignedGroupsCount: 0,
    assignedTeachersCount: 0,
    totalStudentsCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    teachers: [],
  },
];

describe('TenantExamsBasicEducationSubjectsComponent', () => {
  let fixture: ComponentFixture<TenantExamsBasicEducationSubjectsComponent>;
  let listSubjects: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listSubjects = vi.fn().mockResolvedValue(subjects);

    await TestBed.configureTestingModule({
      imports: [TenantExamsBasicEducationSubjectsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
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
          useValue: { listGrades: vi.fn().mockResolvedValue(grades) },
        },
        {
          provide: TenantSubjectsDataService,
          useValue: {
            listSubjects,
            toUserMessage: vi.fn().mockReturnValue('Unable to load subjects.'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantExamsBasicEducationSubjectsComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('loads and renders subjects related to the selected grade row', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(listSubjects).toHaveBeenCalledWith({ stageId: 'stage-primary', gradeId: 'grade-one' });
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Grade One');
    expect(text).toContain('Math');
    expect(text).toContain('Science');
    expect(text).toContain('History');
    expect(text).toContain('3 subjects');
  });

  it('keeps subject rows connected to the existing grade exam list', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/basic-education/stage-primary/grades/grade-one/create');
  });

  it('filters subjects by search text', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'math';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Math');
    expect(text).not.toContain('Science');
    expect(text).not.toContain('History');
    expect(text).toContain('1 of 3 subjects');
  });

  it('filters subjects by assignment status and clears filters', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    select.value = 'without-teachers';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('History');
    expect(text).not.toContain('Math');
    expect(text).not.toContain('Science');
    expect(text).toContain('1 of 3 subjects');

    const clearButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Clear'),
    ) as HTMLButtonElement;

    clearButton.click();
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Math');
    expect(text).toContain('Science');
    expect(text).toContain('History');
    expect(text).toContain('3 subjects');
  });
});
