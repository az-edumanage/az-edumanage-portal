import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { I18nService } from '../../../../core/services/i18n.service';
import { GroupDetails, GroupStudent } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';
import { TenantGroupDetailsComponent } from './tenant-group-details.component';

describe('TenantGroupDetailsComponent', () => {
  let fixture: ComponentFixture<TenantGroupDetailsComponent>;
  const initialGroup: GroupDetails = {
    id: 'group-123',
    name: 'Physics G12-A',
    subjectId: 'subject-1',
    educationCategory: 'BASIC_EDUCATION',
    subject: 'Physics',
    teacher: 'Sarah Nabil',
    room: 'Lab 101',
    schedule: 'Monday 10:00',
    capacity: 25,
    enrolled: 3,
    fees: 500,
    status: 'Active',
    avgAttendanceRate: null,
    absenceRate: null,
    attendanceAvailable: false,
    monthlyRevenue: 1500,
    currency: 'EGP',
    startAt: '10:00',
    duration: 90,
    daySchedules: {},
    scheduleDays: ['Monday', 'Wednesday'],
  };
  const group = signal<GroupDetails | null>(initialGroup);
  const selectedStudent = signal<GroupStudent | null>(null);
  const initialStudents: GroupStudent[] = [
    {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      attendanceRate: 0,
      lastAttendance: '',
    },
    {
      id: 'student-2',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      attendanceRate: 87,
      lastAttendance: '2026-05-31',
    },
  ];
  const students = signal<GroupStudent[]>(initialStudents);
  const exitStudentError = signal<string | null>(null);
  const exitingStudentId = signal<string | null>(null);
  const facade = {
    group,
    selectedStudent,
    students,
    isLoading: signal(false),
    error: signal<string | null>(null),
    exitStudentError,
    exitingStudentId,
    avgAttendanceLabel: signal('0%'),
    absenceRateLabel: signal('0%'),
    monthlyRevenueLabel: signal('1500 EGP'),
    capacityUsageLabel: signal('12%'),
    loadGroup: vi.fn(),
    selectStudent: vi.fn((student: GroupStudent) => selectedStudent.set(student)),
    clearSelectedStudent: vi.fn(() => selectedStudent.set(null)),
    removeStudentFromGroup: vi.fn(),
  };
  const groupDetailsData = {
    loadGroupLessons: vi.fn(),
    addGroupLesson: vi.fn(),
  };
  const subjectsData = {
    getSubjectCurriculumForCategory: vi.fn(),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };
  const i18n = {
    language: signal<'en' | 'ar'>('en'),
  };

  beforeEach(async () => {
    facade.loadGroup.mockClear();
    facade.selectStudent.mockClear();
    facade.clearSelectedStudent.mockClear();
    facade.removeStudentFromGroup.mockClear();
    group.set(initialGroup);
    students.set(initialStudents);
    selectedStudent.set(null);
    exitStudentError.set(null);
    exitingStudentId.set(null);
    facade.isLoading.set(false);
    facade.error.set(null);
    groupDetailsData.loadGroupLessons.mockReset();
    groupDetailsData.loadGroupLessons.mockReturnValue(of([]));
    groupDetailsData.addGroupLesson.mockReset();
    groupDetailsData.addGroupLesson.mockReturnValue(of({
      id: 'group-lesson-1',
      curriculumNodeId: 'lesson-1',
      title: 'Lesson one',
      path: 'Unit one',
      description: 'Intro lesson',
    }));
    subjectsData.getSubjectCurriculumForCategory.mockReset();
    subjectsData.getSubjectCurriculumForCategory.mockResolvedValue({
      id: 'curriculum',
      label: 'Physics Curriculum',
      icon: 'folder',
      description: null,
      children: [
        {
          id: 'unit-1',
          label: 'Unit one',
          icon: 'folder',
          description: null,
          children: [
            {
              id: 'lesson-1',
              label: 'Lesson one',
              icon: 'description',
              description: 'Intro lesson',
              children: [],
            },
          ],
        },
      ],
    });
    await TestBed.configureTestingModule({
      imports: [TenantGroupDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: TenantGroupDetailsFacade, useValue: facade },
        { provide: TenantGroupDetailsDataService, useValue: groupDetailsData },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
        { provide: I18nService, useValue: i18n },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupDetailsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    i18n.language.set('en');
  });

  function selectEnrolledStudentsTab(): void {
    fixture.componentInstance.selectTab('enrolledStudents');
    fixture.detectChanges();
  }

  it('renders the existing metric card labels', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Total Students');
    expect(text).toContain('Avg. Attendance');
    expect(text).toContain('Absence Rate');
    expect(text).toContain('Monthly Revenue');
  });

  it('renders the enrolled students table with the shared table columns', () => {
    selectEnrolledStudentsTab();

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th'),
      (header) => (header as HTMLElement).textContent?.trim(),
    );

    expect(headers).toEqual(['Student', 'Attendance', 'Status', 'Last Seen', 'Actions']);
    expect(fixture.nativeElement.textContent).toContain('Showing 1-2 of 2 students');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 1');
  });

  it('searches and filters enrolled students in the shared table', () => {
    students.set([
      {
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        attendanceRate: 92,
        lastAttendance: '2026-06-01',
        attendanceState: 'Present',
      },
      {
        id: 'student-2',
        name: 'Sara Mohamed',
        email: 'sara@example.com',
        attendanceRate: 70,
        lastAttendance: '2026-06-02',
        attendanceState: 'Absent',
      },
    ]);
    fixture.detectChanges();
    selectEnrolledStudentsTab();

    const searchInput = fixture.nativeElement.querySelector('.tenant-group-lesson-material-search input') as HTMLInputElement;
    searchInput.value = 'sara';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sara Mohamed');
    expect(fixture.nativeElement.textContent).not.toContain('Ahmed Ali');

    const filterSelect = fixture.nativeElement.querySelector('.tenant-group-lesson-material-filter select') as HTMLSelectElement;
    filterSelect.value = 'present';
    filterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No enrolled students match the current search or filter.');
  });

  it('renders group detail tabs between metrics and the enrolled students panel', () => {
    const tabButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab span'),
      (label) => (label as HTMLElement).textContent?.trim(),
    );
    const tabs = fixture.nativeElement.querySelector('.tenant-group-detail-tabs') as HTMLElement;
    const sessionsPanel = fixture.nativeElement.querySelector('#tenant-group-sessions-panel') as HTMLElement;

    expect(tabButtons).toEqual(['Sessions', 'Enrolled Students', 'Lessons', 'Overview']);
    expect(tabs.compareDocumentPosition(sessionsPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fixture.componentInstance.activeTab()).toBe('sessions');
  });

  it('switches to the overview tab and renders group summary fields', () => {
    const overviewTab = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Overview')) as HTMLButtonElement;

    overviewTab.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.activeTab()).toBe('overview');
    expect(fixture.nativeElement.querySelector('#tenant-group-overview-panel')).toBeTruthy();
    expect(text).toContain('Group academic and operational summary');
    expect(text).toContain('Subject');
    expect(text).toContain('Teacher');
    expect(text).toContain('Room');
    expect(text).toContain('Schedule');
  });

  it('switches to the sessions tab and renders the group schedule rows', () => {
    const sessionsTab = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Sessions')) as HTMLButtonElement;

    sessionsTab.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.activeTab()).toBe('sessions');
    expect(text).toContain('2 sessions');
    expect(text).toContain('Session 1');
    expect(text).toContain('Session 2');
    expect(text).toContain('Monday');
    expect(text).toContain('Wednesday');
    expect(text).toContain('10:00 - 11:30');
    expect(text).toContain('Lab 101');
    expect(text).toContain('Advanced Filters');
    expect(text).toContain('Showing 1-2 of 2 sessions');
    expect(text).toContain('Rows');
    expect(text).toContain('Page 1 of 1');
    expect(fixture.nativeElement.querySelector('#tenant-group-enrolled-students-panel')).toBeFalsy();
  });

  it('opens the session details page when a session row is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const firstSessionRow = fixture.nativeElement.querySelector('.tenant-group-session-row') as HTMLElement;
    firstSessionRow.click();

    expect(firstSessionRow.getAttribute('role')).toBe('link');
    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/groups', 'group-123', 'sessions', 'schedule-Monday']);
  });

  it('paginates session rows when the group has more than five sessions', () => {
    group.set({
      ...initialGroup,
      calendarEvents: Array.from({ length: 6 }, (_, index) => ({
        id: `event-${index + 1}`,
        date: `2026-06-${String(index + 1).padStart(2, '0')}`,
        day: `Day ${index + 1}`,
        startTime: '10:00',
        endTime: '11:00',
        room: `Room ${index + 1}`,
      })),
    });
    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page 1 of 2');
    expect(fixture.nativeElement.textContent).toContain('Day 5');
    expect(fixture.nativeElement.textContent).not.toContain('Day 6');

    const nextButton = fixture.nativeElement.querySelector('button[title="Next page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page 2 of 2');
    expect(fixture.nativeElement.textContent).toContain('Day 6');
    expect(fixture.nativeElement.textContent).not.toContain('Day 1');
  });

  it('renders Arabic session numbers when Arabic language is active', () => {
    i18n.language.set('ar');
    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('محاضرة 1');
    expect(text).toContain('محاضرة 2');
    expect(text).not.toContain('Session 1');
  });

  it('marks the first upcoming session as current and the following session as next', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T09:30:00'));
    group.set({
      ...initialGroup,
      calendarEvents: [
        {
          id: 'past-event',
          date: '2026-06-06',
          day: 'Saturday',
          startTime: '08:00',
          endTime: '09:00',
          room: 'Room A',
        },
        {
          id: 'current-event',
          date: '2026-06-06',
          day: 'Saturday',
          startTime: '10:00',
          endTime: '11:00',
          room: 'Room B',
        },
        {
          id: 'next-event',
          date: '2026-06-06',
          day: 'Saturday',
          startTime: '12:00',
          endTime: '13:00',
          room: 'Room C',
        },
      ],
    });

    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-row')) as HTMLElement[];

    expect(rows[0].textContent).not.toContain('Current session');
    expect(rows[0].textContent).not.toContain('Next session');
    expect(rows[1].textContent).toContain('Current session');
    expect(rows[2].textContent).toContain('Next session');
    expect(rows[1].classList).toContain('tenant-group-session-row--current');
    expect(rows[2].classList).not.toContain('tenant-group-session-row--current');
  });

  it('opens the sessions page containing the current session automatically', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T09:30:00'));
    group.set({
      ...initialGroup,
      calendarEvents: Array.from({ length: 9 }, (_, index) => {
        const dayNumber = index + 1;
        return {
          id: `event-${dayNumber}`,
          date: `2026-06-${String(dayNumber).padStart(2, '0')}`,
          day: `Day ${dayNumber}`,
          startTime: '10:00',
          endTime: '11:00',
          room: `Room ${dayNumber}`,
        };
      }),
    });

    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-row')) as HTMLElement[];

    expect(fixture.componentInstance.sessionPageIndex()).toBe(1);
    expect(text).toContain('Page 2 of 2');
    expect(text).toContain('Day 8');
    expect(text).not.toContain('Day 1');
    expect(rows.some((row) => row.textContent?.includes('Day 8') && row.classList.contains('tenant-group-session-row--current'))).toBe(true);
  });

  it('searches and filters sessions in the sessions tab', () => {
    group.set({
      ...initialGroup,
      calendarEvents: [
        {
          id: 'event-1',
          date: '2026-06-06',
          day: 'Saturday',
          startTime: '10:00',
          endTime: '11:00',
          room: 'Lab 101',
        },
        {
          id: 'event-2',
          date: '2026-06-07',
          day: 'Sunday',
          startTime: '12:00',
          endTime: '13:00',
          room: 'Room B',
        },
      ],
    });
    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('.tenant-group-sessions-search input') as HTMLInputElement;
    searchInput.value = 'room b';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 of 2 sessions');
    expect(fixture.nativeElement.textContent).toContain('Sunday');
    expect(fixture.nativeElement.textContent).not.toContain('Saturday');

    const filterButton = fixture.nativeElement.querySelector('.tenant-group-sessions-filter-btn') as HTMLButtonElement;
    filterButton.click();
    fixture.detectChanges();

    const filterSelect = fixture.nativeElement.querySelector('#session-filter-type') as HTMLSelectElement;
    filterSelect.value = 'recurring';
    filterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No sessions match your filters.');
  });

  it('switches to the lessons tab and auto fetches curriculum lessons', async () => {
    const lessonsTab = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Lessons')) as HTMLButtonElement;

    lessonsTab.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.activeTab()).toBe('lessons');
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123');
    expect(subjectsData.getSubjectCurriculumForCategory).toHaveBeenCalledWith('subject-1', 'BASIC_EDUCATION');
    expect(groupDetailsData.addGroupLesson).toHaveBeenCalledWith('group-123', 'lesson-1');
    expect(text).toContain('Lessons');
    expect(text).toContain('Add lesson');
    expect(text).toContain('1 loaded from curriculum');
    expect(text).toContain('Lesson one');
    expect(text).not.toContain('No lessons added yet.');
    expect(fixture.nativeElement.querySelector('#tenant-group-lessons-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#tenant-group-enrolled-students-panel')).toBeFalsy();
  });

  it('auto loads persisted curriculum lessons when the lessons tab is selected', async () => {
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-lesson-1',
        curriculumNodeId: 'lesson-1',
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
    ]));

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123');
    expect(groupDetailsData.addGroupLesson).not.toHaveBeenCalled();
    expect(text).toContain('1 loaded from curriculum');
    expect(text).toContain('Lesson one');
    expect(text).toContain('Unit one');
    expect(text).not.toContain('No lessons added yet.');
  });

  it('auto fetches and displays curriculum lessons without refresh when group data arrives after the lessons tab opens', async () => {
    group.set(null);
    groupDetailsData.loadGroupLessons.mockClear();
    subjectsData.getSubjectCurriculumForCategory.mockClear();
    groupDetailsData.addGroupLesson.mockClear();

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('lessons');
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123');
    expect(subjectsData.getSubjectCurriculumForCategory).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No lessons added yet.');

    group.set(initialGroup);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(subjectsData.getSubjectCurriculumForCategory).toHaveBeenCalledWith('subject-1', 'BASIC_EDUCATION');
    expect(groupDetailsData.addGroupLesson).toHaveBeenCalledWith('group-123', 'lesson-1');
    expect(text).toContain('1 loaded from curriculum');
    expect(text).toContain('Lesson one');
    expect(text).not.toContain('No lessons added yet.');
  });

  it('opens lesson details when a lesson row is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-lesson-1',
        curriculumNodeId: 'lesson-1',
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
    ]));

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const lessonRow = fixture.nativeElement.querySelector('.tenant-group-lesson-content-table-row') as HTMLElement;
    lessonRow.click();

    expect(lessonRow.getAttribute('role')).toBe('link');
    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/groups', 'group-123', 'lessons', 'group-lesson-1']);
  });

  it('renders curriculum lessons in a searchable paginated table', async () => {
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-lesson-1',
        curriculumNodeId: 'lesson-1',
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
      {
        id: 'group-lesson-2',
        curriculumNodeId: 'lesson-2',
        title: 'Lesson two',
        path: 'Unit one',
        description: null,
      },
    ]));

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('#tenant-group-lessons-panel .tenant-group-lesson-material-table th'),
      (header) => (header as HTMLElement).textContent?.trim(),
    );
    expect(headers).toEqual(['Lesson', 'Path', 'Description', 'Action']);
    expect(fixture.nativeElement.textContent).toContain('Showing 1-2 of 2 lessons');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 1');

    const searchInput = fixture.nativeElement.querySelector('.tenant-group-lesson-material-search input') as HTMLInputElement;
    searchInput.value = 'two';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Lesson two');
    expect(fixture.nativeElement.textContent).not.toContain('Lesson one');

    const filterSelect = fixture.nativeElement.querySelector('.tenant-group-lesson-material-filter select') as HTMLSelectElement;
    filterSelect.value = 'withDescription';
    filterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No lessons match the current search or filter.');
  });

  it('keeps the lesson picker available after auto syncing curriculum lessons', async () => {
    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Add lesson')) as HTMLButtonElement;

    addButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123');
    expect(subjectsData.getSubjectCurriculumForCategory).toHaveBeenCalledWith('subject-1', 'BASIC_EDUCATION');
    expect(groupDetailsData.addGroupLesson).toHaveBeenCalledWith('group-123', 'lesson-1');
    expect(fixture.nativeElement.textContent).toContain('Select from curriculum');
    expect(fixture.nativeElement.textContent).toContain('No curriculum lessons available.');

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('1 loaded from curriculum');
    expect(text).toContain('Lesson one');
    expect(text).toContain('Unit one');
    expect(text).not.toContain('No lessons added yet.');
  });

  it('keeps Enroll Student action routed to the selected group enroll screen', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const enrollLink = links.find((link) => link.textContent?.includes('Enroll Student'));

    expect(enrollLink).toBeTruthy();
    expect(enrollLink?.getAttribute('href')).toBe('/tenant/groups/group-123/enroll');
  });

  it('keeps quick actions and sidebar labels unchanged', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Group Settings');
    expect(text).toContain('Self Enrollment');
    expect(text).toContain('Teacher Approval');
    expect(text).toContain('Auto Invoicing');
    expect(text).toContain('Schedule Details');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('Attendance');
    expect(text).toContain('Exam');
    expect(text).toContain('Broadcast');
    expect(text).toContain('Calendar');
    expect(text).toContain('Report');
  });

  it('opens the group calendar from Quick Actions', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const calendarButton = buttons.find((button) => button.textContent?.includes('Calendar'));

    expect(calendarButton).toBeTruthy();

    calendarButton?.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Group Calendar');
    expect(text).toContain('Physics G12-A');
    expect(fixture.nativeElement.querySelector('full-calendar')).toBeTruthy();
  });

  it('adds a custom event to the group calendar', () => {
    const component = fixture.componentInstance;

    component.openCalendar();
    fixture.detectChanges();

    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Add Event')) as HTMLButtonElement;

    addButton.click();
    fixture.detectChanges();

    component.eventForm.setValue({
      title: 'Parent meeting',
      date: '2026-06-08',
      startTime: '13:00',
      endTime: '14:00',
    });
    component.saveCalendarEvent();
    fixture.detectChanges();

    const events = component.calendarOptions().events as Array<{ title?: string }>;
    expect(events.some((event) => event.title === 'Parent meeting')).toBe(true);
    expect(component.eventEditorOpen()).toBe(false);
  });

  it('uses backend dated lecture events in the group calendar', () => {
    group.set({
      ...initialGroup,
      calendarEvents: [
        {
          id: 'group-123:2026-06-06:10:00',
          date: '2026-06-06',
          day: 'Saturday',
          startTime: '10:00',
          endTime: '11:00',
          room: 'Lab 101',
        },
        {
          id: 'group-123:2026-06-07:10:00',
          date: '2026-06-07',
          day: 'Sunday',
          startTime: '10:00',
          endTime: '11:00',
          room: 'Lab 101',
        },
      ],
    });
    fixture.detectChanges();

    const events = fixture.componentInstance.calendarOptions().events as Array<{ start?: string; daysOfWeek?: number[] }>;

    expect(events.map((event) => event.start)).toEqual(['2026-06-06T10:00:00', '2026-06-07T10:00:00']);
    expect(events.some((event) => event.daysOfWeek)).toBe(false);
  });

  it('renders backend-loaded enrolled students in the existing table rows', () => {
    selectEnrolledStudentsTab();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('ahmed@example.com');
    expect(text).toContain('Sara Mohamed');
    expect(text).toContain('sara@example.com');
    expect(text).not.toContain('Omar Hassan');
  });

  it('renders exit group actions for enrolled students', () => {
    selectEnrolledStudentsTab();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('tbody button'),
      (button) => ((button as HTMLButtonElement).textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

    expect(buttons).toEqual(['logout Exit group', 'logout Exit group']);
  });

  it('exits a student from the group without selecting the row', () => {
    selectEnrolledStudentsTab();

    const button = fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(facade.removeStudentFromGroup).toHaveBeenCalledWith('group-123', initialStudents[0]);
    expect(facade.selectStudent).not.toHaveBeenCalled();
  });

  it('renders newly enrolled backend rows through the existing Enrolled Students columns', () => {
    students.set([
      {
        id: 'student-3',
        name: 'Mona Hassan',
        email: 'mona@example.com',
        attendanceRate: 0,
        lastAttendance: '',
      },
      {
        id: 'student-4',
        name: 'Youssef Adel',
        email: 'youssef@example.com',
        attendanceRate: 0,
        lastAttendance: '',
      },
    ]);
    fixture.detectChanges();
    selectEnrolledStudentsTab();

    const rowText = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr'),
      (row) => (row as HTMLTableRowElement).textContent ?? '',
    );

    expect(rowText).toHaveLength(2);
    expect(rowText[0]).toContain('Mona Hassan');
    expect(rowText[0]).toContain('mona@example.com');
    expect(rowText[0]).toContain('0%');
    expect(rowText[1]).toContain('Youssef Adel');
    expect(rowText[1]).toContain('youssef@example.com');
    expect(rowText[1]).toContain('0%');
  });

  it('preserves selected-student overlay behavior with backend-loaded rows', () => {
    selectEnrolledStudentsTab();

    const firstRow = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    firstRow.click();
    fixture.detectChanges();

    expect(facade.selectStudent).toHaveBeenCalledWith(students()[0]);
    expect((fixture.nativeElement.textContent as string)).toContain('Student Profile');
    expect((fixture.nativeElement.textContent as string)).toContain('Ahmed Ali');
    expect((fixture.nativeElement.textContent as string)).not.toContain('18 Sessions');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Feb 15, 2026');
  });

  it('renders backend-bound metric values in the existing cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('3 / 25');
    expect(text).toContain('0%');
    expect(text).toContain('1500 EGP');
  });

  it('uses the existing header text area for loading and error state', () => {
    group.set(null);
    facade.isLoading.set(true);
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string)).toContain('Loading...');

    facade.isLoading.set(false);
    facade.error.set('Group not found');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Group Details');
    expect(text).toContain('Error');
    expect(text).toContain('Group not found');
  });
});
