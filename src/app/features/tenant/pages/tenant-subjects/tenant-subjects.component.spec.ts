import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantSubjectsFacade } from '../../state/tenant-subjects.facade';
import { TenantSubjectsComponent } from './tenant-subjects.component';

describe('TenantSubjectsComponent', () => {
  let fixture: ComponentFixture<TenantSubjectsComponent>;
  const facade = {
    searchQuery: signal(''),
    showFilterPanel: signal(false),
    viewMode: signal<'grid' | 'list'>('grid'),
    subjects: signal([]),
    loading: signal(false),
    loadError: signal<string | null>(null),
    activeFiltersCount: signal(0),
    filteredSubjects: signal([
      {
        id: 'subject-1',
        name: 'Mathematics',
        stageId: 'stage-1',
        stageName: 'Secondary',
        gradeId: 'grade-1',
        gradeName: 'Grade 10',
        assignedGroupsCount: 2,
        totalStudentsCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        groups: [],
      },
    ]),
    stageOptions: signal([{ value: 'stage-1', label: 'Secondary' }]),
    gradeOptions: signal([{ value: 'grade-1', label: 'Grade 10' }]),
    loadSubjects: vi.fn().mockResolvedValue(undefined),
    setFilters: vi.fn(),
    clearAdvancedFilters: vi.fn(),
    clearAllFilters: vi.fn(),
    toggleFilterPanel: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectsFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders subject data with add and details navigation', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Subjects');
    expect(text).toContain('Add New Subject');
    expect(text).toContain('Mathematics');
    expect(text).toContain('Secondary · Grade 10');
  });

  it('loads subjects on init', () => {
    expect(facade.loadSubjects).toHaveBeenCalled();
  });
});
