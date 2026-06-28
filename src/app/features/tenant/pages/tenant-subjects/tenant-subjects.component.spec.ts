import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
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
    deleteError: signal<string | null>(null),
    deletingId: signal<string | null>(null),
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
        assignedTeachersCount: 0,
        totalStudentsCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        groups: [],
        teachers: [],
      },
    ]),
    stageOptions: signal([{ value: 'stage-1', label: 'Secondary' }]),
    gradeOptions: signal([{ value: 'grade-1', label: 'Grade 10' }]),
    loadSubjects: vi.fn().mockResolvedValue(undefined),
    setFilters: vi.fn(),
    clearAdvancedFilters: vi.fn(),
    clearAllFilters: vi.fn(),
    toggleFilterPanel: vi.fn(),
    deleteSubject: vi.fn().mockResolvedValue(true),
  };
  const dataService = {
    listStageOptions: vi.fn().mockResolvedValue([{ value: 'stage-1', label: 'Secondary' }]),
    listGradeOptions: vi.fn().mockResolvedValue([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectsFacade, useValue: facade },
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    facade.viewMode.set('grid');
    dataService.listStageOptions.mockResolvedValue([{ value: 'stage-1', label: 'Secondary' }]);
    dataService.listGradeOptions.mockResolvedValue([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
    vi.clearAllMocks();
  });

  it('renders subject data with add and details navigation', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Subjects');
    expect(text).toContain('Add New Subject');
    expect(text).toContain('Mathematics');
    expect(text).toContain('Secondary · Grade 10');
    expect(fixture.nativeElement.querySelector('a[href="/tenant/subjects/subject-1/edit"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[title="Delete"]')).toBeTruthy();
  });

  it('loads subjects on init', () => {
    expect(facade.loadSubjects).toHaveBeenCalled();
  });

  it('deletes a subject from the action icon', () => {
    const deleteButton = fixture.nativeElement.querySelector('button[title="Delete"]') as HTMLButtonElement;

    deleteButton.click();

    expect(facade.deleteSubject).toHaveBeenCalledWith('subject-1');
  });

  it('opens subject details when a table row is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    facade.viewMode.set('list');
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.tenant-grades-tbody tr') as HTMLTableRowElement;
    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/subjects', 'subject-1']);
  });

  it('does not open subject details when delete action is clicked from a table row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    facade.viewMode.set('list');
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.tenant-grades-row-btn--delete') as HTMLButtonElement;
    deleteButton.click();

    expect(facade.deleteSubject).toHaveBeenCalledWith('subject-1');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('applies stage query parameter as the subjects filter', () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/subjects',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({ stageId: 'stage-1' }),
      },
    });
    vi.clearAllMocks();

    const filteredFixture = TestBed.createComponent(TenantSubjectsComponent);
    filteredFixture.detectChanges();

    expect(facade.setFilters).toHaveBeenCalledWith('stage-1', '', 'name');
    expect(facade.loadSubjects).toHaveBeenCalledWith();
    expect(filteredFixture.componentInstance.filterForm.controls.stageId.value).toBe('stage-1');

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    }
  });

  it('uses list view and hides edit and delete actions in the questions bank route', () => {
    const router = TestBed.inject(Router);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/questions-bank/basic-education',
    });

    facade.viewMode.set('grid');
    const questionsBankFixture = TestBed.createComponent(TenantSubjectsComponent);
    questionsBankFixture.detectChanges();

    expect(facade.viewMode()).toBe('list');
    expect(questionsBankFixture.nativeElement.querySelector('.tenant-grades-table')).toBeTruthy();
    expect(questionsBankFixture.nativeElement.querySelector('.tenant-grades-advanced-filter-btn')).toBeTruthy();
    expect(questionsBankFixture.nativeElement.querySelector('a[href="/tenant/subjects/subject-1/edit"]')).toBeFalsy();
    expect(questionsBankFixture.nativeElement.querySelector('button[title="Delete"]')).toBeFalsy();

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
  });

  it('loads subjects scoped to the selected stage and grade in the questions bank subjects route', async () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/questions-bank/basic-education/stage-1/grades/grade-1',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({ stageId: 'stage-1', gradeId: 'grade-1' }),
      },
    });

    facade.viewMode.set('grid');
    const questionsBankFixture = TestBed.createComponent(TenantSubjectsComponent);
    questionsBankFixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    questionsBankFixture.detectChanges();

    expect(facade.viewMode()).toBe('list');
    expect(facade.setFilters).toHaveBeenCalledWith('', '', 'name');
    expect(facade.loadSubjects).toHaveBeenCalledWith({ stageId: 'stage-1', gradeId: 'grade-1' });
    expect(questionsBankFixture.componentInstance.filterForm.controls.stageId.value).toBe('stage-1');
    expect(questionsBankFixture.componentInstance.filterForm.controls.gradeId.value).toBe('grade-1');
    expect(questionsBankFixture.nativeElement.querySelector('.tenant-grades-advanced-filter-btn')).toBeTruthy();
    facade.showFilterPanel.set(true);
    questionsBankFixture.detectChanges();
    expect(questionsBankFixture.nativeElement.querySelector('#filter-stage')).toBeFalsy();
    expect(questionsBankFixture.nativeElement.querySelector('#filter-grade')).toBeFalsy();

    const text = questionsBankFixture.nativeElement.textContent as string;
    const links = Array.from(questionsBankFixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);
    expect(text).toContain('Questions Bank');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Secondary');
    expect(text).toContain('Grade 10');
    expect(links).toContain('/tenant/questions-bank');
    expect(links).toContain('/tenant/questions-bank/basic-education');
    expect(links).toContain('/tenant/questions-bank/basic-education/stage-1');
    expect(links).toContain('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum');

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    }
  });

  it('keeps the route stage and grade applied when clearing filters in the questions bank subjects route', () => {
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/questions-bank/basic-education/stage-1/grades/grade-1',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({ stageId: 'stage-1', gradeId: 'grade-1' }),
      },
    });

    const questionsBankFixture = TestBed.createComponent(TenantSubjectsComponent);
    questionsBankFixture.componentInstance.searchQuery.set('math');
    questionsBankFixture.componentInstance.filterForm.controls.gradeId.setValue('grade-1');
    questionsBankFixture.detectChanges();

    questionsBankFixture.componentInstance.clearAllFilters();

    expect(questionsBankFixture.componentInstance.searchQuery()).toBe('');
    expect(facade.clearAllFilters).not.toHaveBeenCalled();
    expect(facade.setFilters).toHaveBeenLastCalledWith('', '', 'name');
    expect(questionsBankFixture.componentInstance.filterForm.controls.stageId.value).toBe('stage-1');
    expect(questionsBankFixture.componentInstance.filterForm.controls.gradeId.value).toBe('grade-1');
    expect(questionsBankFixture.componentInstance.filterForm.controls.sortBy.value).toBe('name');
    expect(facade.loadSubjects).toHaveBeenCalledWith({ stageId: 'stage-1', gradeId: 'grade-1' });

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    }
  });
});
