import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantQuestionsBankUniversityCollegesComponent } from './tenant-questions-bank-university-colleges.component';

describe('TenantQuestionsBankUniversityCollegesComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankUniversityCollegesComponent>;
  const universitiesData = {
    listUniversities: vi.fn().mockResolvedValue([
      {
        id: 'university-1',
        name: 'Cairo University',
        code: 'CU',
        countryId: 'country-1',
        countryName: 'Egypt',
        countryCode: 'EG',
        description: 'Public university',
        status: 'Active',
        sortOrder: 1,
        collegeCount: 2,
        subjectCount: 5,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankUniversityCollegesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantUniversitiesDataService, useValue: universitiesData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankUniversityCollegesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('displays universities using the universities table style and links to question-bank colleges', () => {
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(universitiesData.listUniversities).toHaveBeenCalledWith({ search: '' });
    expect(text).toContain('Universities');
    expect(text).toContain('Cairo University');
    expect(text).toContain('Egypt');
    expect(text).toContain('2');
    expect(text).toContain('5');
    expect(fixture.nativeElement.querySelector('.tenant-universities-table')).toBeTruthy();
    expect(links).toContain('/tenant/questions-bank/university-education/universities/university-1');
  });

  it('opens university colleges when clicking the table row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/questions-bank/university-education/universities', 'university-1']);
  });
});
