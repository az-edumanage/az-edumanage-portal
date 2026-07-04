import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TenantUniversitiesFacade } from '../../state/tenant-universities.facade';
import { TenantUniversitiesComponent } from './tenant-universities.component';

describe('TenantUniversitiesComponent', () => {
  let fixture: ComponentFixture<TenantUniversitiesComponent>;
  const facade = {
    searchQuery: signal(''),
    countryFilter: signal(''),
    sortFilter: signal('order'),
    filteredUniversities: signal([
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
    countryOptions: signal([]),
    optionsLoading: signal(false),
    loading: signal(false),
    loadError: signal<string | null>(null),
    deleteError: signal<string | null>(null),
    deletingId: signal<string | null>(null),
    loadCountryOptions: vi.fn().mockResolvedValue(undefined),
    loadUniversities: vi.fn().mockResolvedValue(undefined),
    setSearch: vi.fn(),
    setCountryFilter: vi.fn(),
    setSortFilter: vi.fn(),
    deleteUniversity: vi.fn().mockResolvedValue(true),
  };
  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TenantUniversitiesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantUniversitiesFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantUniversitiesComponent);
    fixture.detectChanges();
  });

  it('opens related colleges when clicking a university table row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/universities');
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    fixture.detectChanges();
    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/colleges'], {
      queryParams: { universityId: 'university-1' },
    });
  });

  it('routes to the exams university colleges page when clicking a university row from exams university education', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/exams/university-education');

    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    row.click();

    expect(row.getAttribute('role')).toBe('link');
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.classList.contains('tenant-universities-tr--clickable')).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/exams/university-education', 'university-1']);
  });

  it('hides edit and delete row actions from exams university education', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/exams/university-education');

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tenant-universities-row-btn--view')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.tenant-universities-row-btn--edit')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tenant-universities-row-btn--delete')).toBeNull();
  });

  it('keeps row actions from triggering related-colleges navigation', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const actionCell = fixture.nativeElement.querySelector('.tenant-universities-td--actions') as HTMLTableCellElement;

    actionCell.click();

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
