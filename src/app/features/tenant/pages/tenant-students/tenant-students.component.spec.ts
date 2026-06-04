import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Student } from '../../models/tenant-students.models';
import { TenantStudentsFacade } from '../../state/tenant-students.facade';
import { TenantStudentsComponent } from './tenant-students.component';

describe('TenantStudentsComponent', () => {
  let fixture: ComponentFixture<TenantStudentsComponent>;
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantStudentsComponent);
    fixture.detectChanges();
  });

  it('loads students during initialization', () => {
    expect(facade.loadStudents).toHaveBeenCalledOnce();
  });

  it('links the visibility action to the student details screen', () => {
    const student: Student = {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Basic Education',
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

  it('renders table pagination controls in list view', () => {
    facade.filteredStudents.set([
      {
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        grade: 'Basic Education',
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
  });
});
