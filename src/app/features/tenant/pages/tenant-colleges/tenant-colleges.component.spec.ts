import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TenantCollegesFacade } from '../../state/tenant-colleges.facade';
import { TenantCollegesComponent } from './tenant-colleges.component';

describe('TenantCollegesComponent', () => {
  let fixture: ComponentFixture<TenantCollegesComponent>;
  const facade = {
    searchQuery: signal(''),
    filteredColleges: signal([
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
    colleges: signal([]),
    loading: signal(false),
    loadError: signal<string | null>(null),
    deleteError: signal<string | null>(null),
    deletingId: signal<string | null>(null),
    universityFilter: signal(''),
    universityOptions: signal([{ value: 'university-1', label: 'Cairo University' }]),
    optionsLoading: signal(false),
    loadUniversityOptions: vi.fn().mockResolvedValue(undefined),
    loadColleges: vi.fn().mockResolvedValue(undefined),
    setSearch: vi.fn(),
    setUniversityFilter: vi.fn((universityId: string) => facade.universityFilter.set(universityId)),
    deleteCollege: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    facade.universityFilter.set('');
    await TestBed.configureTestingModule({
      imports: [TenantCollegesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ universityId: 'university-1' }),
            },
          },
        },
        { provide: TenantCollegesFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantCollegesComponent);
    fixture.detectChanges();
  });

  it('applies universityId query parameter as the university filter', () => {
    expect(facade.setUniversityFilter).toHaveBeenCalledWith('university-1');
    expect(facade.loadUniversityOptions).toHaveBeenCalled();
    expect(facade.loadColleges).toHaveBeenCalled();
    expect(fixture.componentInstance.viewMode()).toBe('list');
  });
});
