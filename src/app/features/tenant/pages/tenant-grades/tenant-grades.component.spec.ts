import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TenantGradesFacade } from '../../state/tenant-grades.facade';
import { TenantGradesComponent } from './tenant-grades.component';

describe('TenantGradesComponent', () => {
  let fixture: ComponentFixture<TenantGradesComponent>;
  let facade: ReturnType<typeof createFacade>;

  beforeEach(async () => {
    facade = createFacade();
    await TestBed.configureTestingModule({
      imports: [TenantGradesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantGradesFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGradesComponent);
    fixture.detectChanges();
  });

  it('loads grades on init', () => {
    expect(facade.loadGrades).toHaveBeenCalled();
  });

  it('routes a grade row to related subjects', () => {
    facade.viewMode.set('list');
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('.tenant-grades-tr--clickable') as HTMLTableRowElement;

    row.click();

    expect(navigate).toHaveBeenCalledWith(['/tenant/subjects'], {
      queryParams: {
        stageId: 'stage-primary',
        gradeId: 'grade-primary-1',
      },
    });
  });

  it('does not route when row action buttons are clicked', () => {
    facade.viewMode.set('list');
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const deleteButton = fixture.nativeElement.querySelector('.tenant-grades-row-btn--delete') as HTMLButtonElement;

    deleteButton.click();

    expect(navigate).not.toHaveBeenCalled();
    expect(facade.openDeleteConfirmation).toHaveBeenCalledWith(facade.grades()[0]);
  });

  it('applies stage query parameter as the grades filter', () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/grades',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({ stageId: 'stage-primary' }),
      },
    });
    vi.clearAllMocks();

    const filteredFixture = TestBed.createComponent(TenantGradesComponent);
    filteredFixture.detectChanges();

    expect(facade.viewMode()).toBe('list');
    expect(facade.setStageFilter).toHaveBeenCalledWith('stage-primary');
    expect(facade.loadGrades).toHaveBeenCalledWith();

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    }
  });
});

function createFacade() {
  const viewMode = signal<'grid' | 'list'>('grid');
  const grades = signal([
    {
      id: 'grade-primary-1',
      name: 'Primary 1',
      description: null,
      level: 'Primary',
      stageId: 'stage-primary',
      countryId: 'country-eg',
      country: 'Egypt',
      countryCode: null,
      studentCount: 24,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      groups: [],
    },
  ]);

  return {
    searchQuery: signal(''),
    showFilterPanel: signal(false),
    viewMode,
    grades,
    loading: signal(false),
    loadError: signal<string | null>(null),
    activeFiltersCount: computed(() => 0),
    filteredGrades: computed(() => grades()),
    levelOptions: computed(() => ['Primary']),
    deleteState: signal({ grade: null, status: 'closed' as const, message: null }),
    loadGrades: vi.fn().mockResolvedValue(undefined),
    setFilters: vi.fn(),
    setStageFilter: vi.fn(),
    clearAdvancedFilters: vi.fn(),
    clearAllFilters: vi.fn(),
    toggleFilterPanel: vi.fn(),
    openDeleteConfirmation: vi.fn(),
    cancelDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    confirmDelete: vi.fn(),
  };
}
