import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { Student } from '../../models/tenant-students.models';
import { TenantStudentsFacade } from '../../state/tenant-students.facade';
import { TenantStudentsComponent } from './tenant-students.component';

describe('TenantStudentsComponent', () => {
  let fixture: ComponentFixture<TenantStudentsComponent>;
  let router: Router;
  let stagesData: { listStages: ReturnType<typeof vi.fn> };
  let gradesData: { listGrades: ReturnType<typeof vi.fn> };
  let facade: {
    searchQuery: ReturnType<typeof signal<string>>;
    showFilterPanel: ReturnType<typeof signal<boolean>>;
    viewMode: ReturnType<typeof signal<'grid' | 'list'>>;
    students: ReturnType<typeof signal<Student[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    activeFiltersCount: ReturnType<typeof signal<number>>;
    filteredStudents: ReturnType<typeof signal<Student[]>>;
    pagedStudents: ReturnType<typeof signal<Student[]>>;
    totalFilteredStudents: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    pageIndex: ReturnType<typeof signal<number>>;
    pageSize: ReturnType<typeof signal<number>>;
    pageStart: ReturnType<typeof signal<number>>;
    pageEnd: ReturnType<typeof signal<number>>;
    loadStudents: ReturnType<typeof vi.fn>;
    setFilters: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    clearAllFilters: ReturnType<typeof vi.fn>;
    clearAdvancedFilters: ReturnType<typeof vi.fn>;
    toggleFilterPanel: ReturnType<typeof vi.fn>;
    previousPage: ReturnType<typeof vi.fn>;
    nextPage: ReturnType<typeof vi.fn>;
    setPageSize: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    stagesData = {
      listStages: vi.fn().mockResolvedValue([
        {
          id: 'stage-primary',
          name: 'Primary Stage',
          code: null,
          order: 1,
          status: 'Active',
          countryId: 'country-1',
          country: 'Egypt',
          countryCode: 'EG',
          gradeCount: 1,
          classCount: 0,
          description: '',
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-06-01T10:00:00Z',
        },
      ]),
    };
    gradesData = {
      listGrades: vi.fn().mockResolvedValue([
        {
          id: 'grade-10',
          name: 'Grade 10',
          description: null,
          level: '10',
          stageId: 'stage-primary',
          countryId: 'country-1',
          country: 'Egypt',
          countryCode: 'EG',
          studentCount: 1,
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-06-01T10:00:00Z',
          groups: [],
        },
      ]),
    };
    facade = {
      searchQuery: signal(''),
      showFilterPanel: signal(false),
      viewMode: signal('list'),
      students: signal<Student[]>([]),
      isLoading: signal(false),
      errorMessage: signal(null),
      activeFiltersCount: signal(0),
      filteredStudents: signal<Student[]>([]),
      pagedStudents: signal<Student[]>([]),
      totalFilteredStudents: signal(0),
      totalPages: signal(1),
      pageIndex: signal(0),
      pageSize: signal(10),
      pageStart: signal(0),
      pageEnd: signal(0),
      loadStudents: vi.fn(),
      setFilters: vi.fn(),
      setSearchQuery: vi.fn(),
      clearAllFilters: vi.fn(),
      clearAdvancedFilters: vi.fn(),
      toggleFilterPanel: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      setPageSize: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantStudentsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantStudentsFacade, useValue: facade },
        { provide: TenantEducationalStagesDataService, useValue: stagesData },
        { provide: TenantGradesDataService, useValue: gradesData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantStudentsComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('loads students during initialization', () => {
    expect(facade.loadStudents).toHaveBeenCalledOnce();
  });

  it('loads backend stages and grades into the advanced filters', async () => {
    facade.showFilterPanel.set(true);

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(stagesData.listStages).toHaveBeenCalledOnce();
    expect(gradesData.listGrades).toHaveBeenCalledOnce();
    expect(text).toContain('Stage');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Grade 10');
  });

  it('links the visibility action to the student details screen', () => {
    const student: Student = {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 10',
      stage: 'Primary Stage',
      status: 'Active',
      enrollmentDate: 'Jun 2026',
    };
    facade.filteredStudents.set([student]);
    facade.pagedStudents.set([student]);
    facade.totalFilteredStudents.set(1);
    facade.pageStart.set(1);
    facade.pageEnd.set(1);
    fixture.detectChanges();

    const viewLink = fixture.nativeElement.querySelector('a[title="View Details"]') as HTMLAnchorElement;

    expect(viewLink.getAttribute('href')).toBe('/tenant/students/student-1');
  });

  it('opens student details when a table row is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const student: Student = {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 10',
      stage: 'Primary Stage',
      status: 'Active',
      enrollmentDate: 'Jun 2026',
    };
    facade.filteredStudents.set([student]);
    facade.pagedStudents.set([student]);
    facade.totalFilteredStudents.set(1);
    facade.pageStart.set(1);
    facade.pageEnd.set(1);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/students', 'student-1']);
  });

  it('does not open student details when a row action is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const student: Student = {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 10',
      stage: 'Primary Stage',
      status: 'Active',
      enrollmentDate: 'Jun 2026',
    };
    facade.filteredStudents.set([student]);
    facade.pagedStudents.set([student]);
    facade.totalFilteredStudents.set(1);
    facade.pageStart.set(1);
    facade.pageEnd.set(1);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('button[title="Edit"]') as HTMLButtonElement;
    editButton.click();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('renders table pagination controls in list view', () => {
    facade.filteredStudents.set([
      {
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        grade: 'Grade 10',
        stage: 'Primary Stage',
        status: 'Active',
        enrollmentDate: 'Jun 2026',
      },
    ]);
    facade.pagedStudents.set(facade.filteredStudents());
    facade.totalFilteredStudents.set(1);
    facade.pageStart.set(1);
    facade.pageEnd.set(1);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Showing 1-1 of 1 students');
    expect(text).toContain('Page 1 of 1');
    expect(text).toContain('Grade 10');
    expect(text).toContain('Primary Stage');
  });
});
