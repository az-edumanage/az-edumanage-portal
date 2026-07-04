import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { Student, StudentAttendanceCard } from '../../models/tenant-students.models';
import { TenantStudentsFacade } from '../../state/tenant-students.facade';
import { TaskService } from '../../../../core/services/task.service';
import { TenantStudentsComponent } from './tenant-students.component';

describe('TenantStudentsComponent', () => {
  let fixture: ComponentFixture<TenantStudentsComponent>;
  let router: Router;
  let taskService: { removeTask: ReturnType<typeof vi.fn> };
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
    deleteState: ReturnType<typeof signal<{ status: 'closed' | 'confirming' | 'deleting' | 'success' | 'failed'; student: Student | null; message: string }>>;
    passwordModalStudent: ReturnType<typeof signal<Student | null>>;
    passwordSaving: ReturnType<typeof signal<boolean>>;
    passwordError: ReturnType<typeof signal<string | null>>;
    passwordSuccess: ReturnType<typeof signal<string | null>>;
    attendanceSummaryError: ReturnType<typeof signal<string | null>>;
    attendanceCards: ReturnType<typeof signal<StudentAttendanceCard[]>>;
    attendanceFilterLabel: ReturnType<typeof signal<string>>;
    emptyStateTitle: ReturnType<typeof signal<string>>;
    emptyStateDescription: ReturnType<typeof signal<string>>;
    loadStudents: ReturnType<typeof vi.fn>;
    reloadAttendanceSummary: ReturnType<typeof vi.fn>;
    setAttendanceFilter: ReturnType<typeof vi.fn>;
    setFilters: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    clearAllFilters: ReturnType<typeof vi.fn>;
    clearAdvancedFilters: ReturnType<typeof vi.fn>;
    toggleFilterPanel: ReturnType<typeof vi.fn>;
    previousPage: ReturnType<typeof vi.fn>;
    nextPage: ReturnType<typeof vi.fn>;
    setPageSize: ReturnType<typeof vi.fn>;
    requestDelete: ReturnType<typeof vi.fn>;
    confirmDelete: ReturnType<typeof vi.fn>;
    closeDeleteModal: ReturnType<typeof vi.fn>;
    openPasswordModal: ReturnType<typeof vi.fn>;
    closePasswordModal: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    taskService = {
      removeTask: vi.fn(),
    };
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
      deleteState: signal({ status: 'closed', student: null, message: '' }),
      passwordModalStudent: signal(null),
      passwordSaving: signal(false),
      passwordError: signal(null),
      passwordSuccess: signal(null),
      attendanceSummaryError: signal(null),
      attendanceCards: signal<StudentAttendanceCard[]>([
        {
          key: 'all',
          label: 'Total students',
          count: 1,
          active: true,
          loading: false,
          unavailable: false,
          disabled: false,
        },
        {
          key: 'absent',
          label: 'Total absence',
          count: 0,
          active: false,
          loading: false,
          unavailable: false,
          disabled: false,
        },
        {
          key: 'present',
          label: 'Total present',
          count: 1,
          active: false,
          loading: false,
          unavailable: false,
          disabled: false,
        },
      ]),
      attendanceFilterLabel: signal('all students'),
      emptyStateTitle: signal('No students found'),
      emptyStateDescription: signal("We couldn't find any students matching your current search and filter criteria."),
      loadStudents: vi.fn(),
      reloadAttendanceSummary: vi.fn(),
      setAttendanceFilter: vi.fn(),
      setFilters: vi.fn(),
      setSearchQuery: vi.fn(),
      clearAllFilters: vi.fn(),
      clearAdvancedFilters: vi.fn(),
      toggleFilterPanel: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      setPageSize: vi.fn(),
      requestDelete: vi.fn(),
      confirmDelete: vi.fn(),
      closeDeleteModal: vi.fn(),
      openPasswordModal: vi.fn(),
      closePasswordModal: vi.fn(),
      changePassword: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantStudentsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantStudentsFacade, useValue: facade },
        { provide: TaskService, useValue: taskService },
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

  it('clears the saved create draft before opening the add student form', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button): button is HTMLButtonElement => button.textContent?.includes('Add Student') ?? false);
    addButton?.click();

    expect(taskService.removeTask).toHaveBeenCalledWith('create-student-task');
    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/students/create']);
  });

  it('renders attendance summary cards above the list controls', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Total students');
    expect(text).toContain('Total absence');
    expect(text).toContain('Total present');
  });

  it('sets absent attendance filter when the absent card is clicked', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.tenant-students-summary-card')) as HTMLButtonElement[];
    buttons[1].click();

    expect(facade.setAttendanceFilter).toHaveBeenCalledWith('absent');
  });

  it('sets present attendance filter when the present card is clicked', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.tenant-students-summary-card')) as HTMLButtonElement[];
    buttons[2].click();

    expect(facade.setAttendanceFilter).toHaveBeenCalledWith('present');
  });

  it('shows retry affordance when attendance summary is unavailable', () => {
    facade.attendanceSummaryError.set('Summary unavailable');
    facade.attendanceCards.update((cards) => cards.map((card) => card.key === 'all' ? card : { ...card, disabled: true, unavailable: true }));
    fixture.detectChanges();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button): button is HTMLButtonElement => button.textContent?.includes('Retry') ?? false);
    expect(fixture.nativeElement.textContent).toContain('Attendance summary is unavailable');
    retryButton?.click();
    expect(facade.reloadAttendanceSummary).toHaveBeenCalled();
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

  it('opens edit form when the edit action is clicked', () => {
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

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/students', 'student-1', 'edit']);
  });

  it('opens delete confirmation when the delete action is clicked', () => {
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

    const deleteButton = fixture.nativeElement.querySelector('button[title="Delete"]') as HTMLButtonElement;
    deleteButton.click();

    expect(facade.requestDelete).toHaveBeenCalledWith('student-1');
  });

  it('opens change password modal when the password action is clicked', () => {
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

    const passwordButton = fixture.nativeElement.querySelector('button[title="Change Password"]') as HTMLButtonElement;
    passwordButton.click();

    expect(facade.openPasswordModal).toHaveBeenCalledWith('student-1');
  });

  it('submits a changed student password from the modal', () => {
    const student: Student = {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 10',
      stage: 'Primary Stage',
      status: 'Active',
      enrollmentDate: 'Jun 2026',
    };
    facade.passwordModalStudent.set(student);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#student-new-password') as HTMLInputElement;
    input.value = 'Student123!';
    input.dispatchEvent(new Event('input'));
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(facade.changePassword).toHaveBeenCalledWith('Student123!');
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
