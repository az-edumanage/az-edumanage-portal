import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantQuestionsBankUniversityCollegeListComponent } from './tenant-questions-bank-university-college-list.component';

describe('TenantQuestionsBankUniversityCollegeListComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankUniversityCollegeListComponent>;
  let router: Router;
  const universitiesData = {
    getUniversity: vi.fn().mockResolvedValue({
      id: 'university-1',
      name: 'Cairo University',
      code: 'CU',
      countryId: 'country-1',
      countryName: 'Egypt',
      countryCode: 'EG',
      description: 'Public university',
      status: 'Active',
      sortOrder: 1,
      collegeCount: 1,
      subjectCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
  };
  const collegesData = {
    listColleges: vi.fn().mockResolvedValue([
      {
        id: 'college-1',
        universityId: 'university-1',
        universityName: 'Cairo University',
        name: 'Engineering',
        description: 'Engineering college',
        subjectCount: 3,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankUniversityCollegeListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ universityId: 'university-1' }),
            },
          },
        },
        { provide: TenantUniversitiesDataService, useValue: universitiesData },
        { provide: TenantCollegesDataService, useValue: collegesData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankUniversityCollegeListComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('loads colleges for the selected university in the basic education table style', () => {
    const text = fixture.nativeElement.textContent as string;
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement | null;

    expect(universitiesData.getUniversity).toHaveBeenCalledWith('university-1');
    expect(collegesData.listColleges).toHaveBeenCalledWith({ universityId: 'university-1' });
    expect(table).not.toBeNull();
    expect(text).toContain('Cairo University');
    expect(text).toContain('Engineering');
    expect(text).toContain('Engineering college');
    expect(text).toContain('1 colleges');
  });

  it('opens college subjects from the row action', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openButton = fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement;

    openButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/questions-bank/university-education/colleges', 'college-1']);
  });

  it('keeps college subject navigation under exams when opened from exams university education', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/exams/university-education/university-1');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openButton = fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement;

    fixture.detectChanges();
    openButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/exams/university-education', 'university-1', 'colleges', 'college-1']);
  });
});
