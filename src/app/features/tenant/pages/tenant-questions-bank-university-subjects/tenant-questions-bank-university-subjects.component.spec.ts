import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { TenantQuestionsBankUniversitySubjectsComponent } from './tenant-questions-bank-university-subjects.component';

describe('TenantQuestionsBankUniversitySubjectsComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankUniversitySubjectsComponent>;
  const collegesData = {
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
  };
  const subjectsData = {
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
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankUniversitySubjectsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ universityId: 'university-1', collegeId: 'college-1' }),
            },
          },
        },
        { provide: TenantCollegesDataService, useValue: collegesData },
        { provide: TenantUniversitySubjectsDataService, useValue: subjectsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankUniversitySubjectsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('loads subjects for the selected college in the basic education table style', () => {
    const text = fixture.nativeElement.textContent as string;
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement | null;

    expect(collegesData.getCollege).toHaveBeenCalledWith('college-1');
    expect(subjectsData.listSubjects).toHaveBeenCalledWith({ collegeId: 'college-1' });
    expect(table).not.toBeNull();
    expect(text).toContain('Engineering');
    expect(text).toContain('Thermodynamics');
    expect(text).toContain('Heat and energy');
    expect(text).toContain('1 subjects');
    expect(text).toContain('2');
    expect(text).toContain('40');
  });

  it('opens subject curriculum from the row action', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openButton = fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement;

    openButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/questions-bank/university-education/colleges', 'college-1', 'subjects', 'subject-1', 'curriculum']);
  });

  it('opens the college exams list from the row action in exams university education', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/exams/university-education/university-1/colleges/college-1');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openButton = fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement;

    openButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/exams/university-education', 'university-1', 'colleges', 'college-1', 'create']);
  });
});
