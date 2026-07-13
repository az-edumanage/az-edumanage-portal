import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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
      phone: '+201000000001',
      parentName: 'Parent Ali',
      parentPhone: '+201111111111',
      notifyParent: true,
      attendanceRate: 0,
      lastAttendance: '',
    },
    {
      id: 'student-2',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      phone: '+201000000002',
      parentName: 'Parent Mohamed',
      parentPhone: '+201222222222',
      notifyParent: false,
      attendanceRate: 87,
      lastAttendance: '2026-05-31',
      attendanceState: 'Present',
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
    loadGroupExams: vi.fn(),
    deleteGroupExam: vi.fn(),
    loadGroupLessons: vi.fn(),
    addGroupLesson: vi.fn(),
    loadGroupLessonContent: vi.fn(),
    addGroupLessonContent: vi.fn(),
    loadGroupLibraryFolders: vi.fn(),
    createGroupLibraryFolder: vi.fn(),
    loadGroupLibraryFiles: vi.fn(),
    uploadGroupLibraryFile: vi.fn(),
    loadGroupLibraryNotes: vi.fn(),
    createGroupLibraryNote: vi.fn(),
    updateGroupLibraryNote: vi.fn(),
    loadGroupLibraryLinks: vi.fn(),
    createGroupLibraryLink: vi.fn(),
  };
  const subjectsData = {
    getSubjectCurriculumForCategory: vi.fn(),
    listCurriculumMaterialFolders: vi.fn(),
    listCurriculumMaterialFiles: vi.fn(),
    listCurriculumMaterialNotes: vi.fn(),
    listCurriculumMaterialLinks: vi.fn(),
    createCurriculumMaterialFolder: vi.fn(),
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
    localStorage.removeItem('tenant-group:group-123:display-payment-status');
    facade.isLoading.set(false);
    facade.error.set(null);
    groupDetailsData.loadGroupExams.mockReset();
    groupDetailsData.loadGroupExams.mockReturnValue(of([]));
    groupDetailsData.deleteGroupExam.mockReset();
    groupDetailsData.deleteGroupExam.mockReturnValue(of(undefined));
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
    groupDetailsData.loadGroupLessonContent.mockReset();
    groupDetailsData.loadGroupLessonContent.mockReturnValue(of([]));
    groupDetailsData.addGroupLessonContent.mockReset();
    groupDetailsData.addGroupLessonContent.mockReturnValue(of({
      id: 'content-1',
      curriculumNodeId: 'unit-1',
      curriculumNodeLabel: 'Unit one',
      folderId: 'folder-1',
      folderName: 'Unit material',
      contentType: 'FILE',
      contentId: 'file-1',
      title: 'intro.pdf',
      url: '/uploads/intro.pdf',
      fileContentType: 'application/pdf',
      sizeBytes: 2048,
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
    subjectsData.listCurriculumMaterialFolders.mockReset();
    subjectsData.listCurriculumMaterialFolders.mockResolvedValue([]);
    subjectsData.listCurriculumMaterialFiles.mockReset();
    subjectsData.listCurriculumMaterialFiles.mockResolvedValue([]);
    subjectsData.listCurriculumMaterialNotes.mockReset();
    subjectsData.listCurriculumMaterialNotes.mockResolvedValue([]);
    subjectsData.listCurriculumMaterialLinks.mockReset();
    subjectsData.listCurriculumMaterialLinks.mockResolvedValue([]);
    subjectsData.createCurriculumMaterialFolder.mockReset();
    subjectsData.createCurriculumMaterialFolder.mockResolvedValue({
      id: 'created-folder',
      name: 'Created material',
      description: null,
      fileTypes: [],
      filesCount: 0,
      createdAt: '',
      updatedAt: '',
    });
    groupDetailsData.loadGroupLibraryFolders.mockReset();
    groupDetailsData.loadGroupLibraryFolders.mockReturnValue(of([]));
    groupDetailsData.createGroupLibraryFolder.mockReset();
    groupDetailsData.createGroupLibraryFolder.mockReturnValue(of({
      id: 'created-folder',
      name: 'Created material',
      description: null,
      fileTypes: [],
      filesCount: 0,
      createdAt: '',
      updatedAt: '',
    }));
    groupDetailsData.loadGroupLibraryFiles.mockReset();
    groupDetailsData.loadGroupLibraryFiles.mockReturnValue(of([]));
    groupDetailsData.uploadGroupLibraryFile.mockReset();
    groupDetailsData.loadGroupLibraryNotes.mockReset();
    groupDetailsData.loadGroupLibraryNotes.mockReturnValue(of([]));
    groupDetailsData.createGroupLibraryNote.mockReset();
    groupDetailsData.updateGroupLibraryNote.mockReset();
    groupDetailsData.loadGroupLibraryLinks.mockReset();
    groupDetailsData.loadGroupLibraryLinks.mockReturnValue(of([]));
    groupDetailsData.createGroupLibraryLink.mockReset();
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
              data: {},
            },
          },
        },
        { provide: TenantGroupDetailsFacade, useValue: facade },
        { provide: TenantGroupDetailsDataService, useValue: groupDetailsData },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
        { provide: I18nService, useValue: i18n },
        provideHttpClient(),
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
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
    expect(text).toContain('Total Sessions');
    expect(text).toContain('2 sessions');
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
        attendanceTime: '2026-06-17T17:05:00+03:00',
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

    expect(tabButtons).toEqual(['Sessions', 'Enrolled Students', 'Lessons', 'Library', 'Exams', 'Overview']);
    expect(tabButtons.indexOf('Exams')).toBeLessThan(tabButtons.indexOf('Overview'));
    expect(tabs.compareDocumentPosition(sessionsPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fixture.componentInstance.activeTab()).toBe('sessions');
  });

  it('loads and renders published exams from the exams tab', async () => {
    groupDetailsData.loadGroupExams.mockReturnValue(of([
      {
        id: 'assignment-1',
        groupId: 'group-123',
        examId: 'exam-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        date: '2026-07-01',
        startTime: '09:30',
        duration: 60,
        questionCount: 24,
        instructions: 'Read carefully',
        updatedAt: '2026-06-27T08:45:00Z',
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      },
      {
        id: 'home-work-assignment-1',
        groupId: 'group-123',
        examId: 'home-work-exam-1',
        title: 'Science Home Work - 2026-07-06',
        status: 'PUBLISHED',
        date: '2026-07-06',
        startTime: null,
        duration: 60,
        questionCount: 1,
        instructions: null,
        updatedAt: null,
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      },
    ]));

    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(groupDetailsData.loadGroupExams).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
    expect(fixture.nativeElement.querySelector('#tenant-group-exams-panel')).toBeTruthy();
    expect(text).toContain('Physics Midterm');
    expect(text).toContain('2026-07-01 at 09:30');
    expect(text).toContain('60 min');
    expect(text).toContain('24 questions');
    expect(text).toContain('1 published exam');
    expect(text).not.toContain('Science Home Work - 2026-07-06');
    expect(text).not.toContain('2026-07-06 anytime');
    expect(text).not.toContain('Shuffle');
    expect(fixture.nativeElement.querySelector('button[title="Edit exam"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[title="Delete exam"]')).toBeTruthy();
  });

  it('edits and deletes exams from row action icons', async () => {
    groupDetailsData.loadGroupExams.mockReturnValue(of([
      {
        id: 'assignment-1',
        groupId: 'group-123',
        examId: 'exam-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        date: '2026-07-01',
        startTime: '09:30',
        duration: 60,
        questionCount: 24,
        instructions: 'Read carefully',
        updatedAt: '2026-06-27T08:45:00Z',
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      },
      {
        id: 'assignment-2',
        groupId: 'group-123',
        examId: 'exam-2',
        title: 'Chemistry Final',
        status: 'PUBLISHED',
        date: '2026-07-02',
        startTime: '10:30',
        duration: 45,
        questionCount: 12,
        instructions: null,
        updatedAt: null,
        settings: {
          showResultsImmediately: true,
          allowRetakes: true,
        },
      },
    ]));

    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('button[title="Edit exam"]') as HTMLButtonElement;
    editButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/tenant/groups', 'group-123', 'exam']);
    expect(fixture.nativeElement.textContent).toContain('Physics Midterm');

    const deleteButton = Array.from(
      fixture.nativeElement.querySelectorAll('button[title="Delete exam"]'),
    )[1] as HTMLButtonElement;
    deleteButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupDetailsData.deleteGroupExam).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Delete Chemistry Final from this group?');

    const confirmDeleteButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => (button as HTMLButtonElement).textContent?.trim() === 'Delete exam') as HTMLButtonElement;
    confirmDeleteButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupDetailsData.deleteGroupExam).toHaveBeenCalledWith('group-123', 'assignment-2');
    expect(fixture.nativeElement.textContent).toContain('Physics Midterm');
    expect(fixture.nativeElement.textContent).not.toContain('Chemistry Final');
    expect(fixture.nativeElement.textContent).not.toContain('Delete Chemistry Final from this group?');
  });

  it('shows exams empty and recoverable error states', async () => {
    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No published exams are assigned to this group yet.');

    groupDetailsData.loadGroupExams.mockReset();
    groupDetailsData.loadGroupExams.mockReturnValue(throwError(() => new Error('Unable to load exams')));
    fixture.componentInstance.groupExamsLoaded.set(false);
    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load exams');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('filters and paginates exams in the exams tab', async () => {
    groupDetailsData.loadGroupExams.mockReturnValue(of(
      Array.from({ length: 6 }, (_, index) => ({
        id: `assignment-${index + 1}`,
        groupId: 'group-123',
        examId: `exam-${index + 1}`,
        title: index === 5 ? 'Chemistry Final' : `Physics Exam ${index + 1}`,
        status: 'PUBLISHED',
        date: `2026-07-${String(index + 1).padStart(2, '0')}`,
        startTime: `${String(9 + index).padStart(2, '0')}:00`,
        duration: 60,
        questionCount: index + 1,
        instructions: null,
        updatedAt: null,
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      })),
    ));

    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page 1 of 2');
    expect(fixture.nativeElement.textContent).toContain('Physics Exam 5');
    expect(fixture.nativeElement.textContent).not.toContain('Chemistry Final');

    const nextButton = fixture.nativeElement.querySelector('button[title="Next exam page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chemistry Final');

    const searchInput = fixture.nativeElement.querySelector('#tenant-group-exams-panel input[type="search"]') as HTMLInputElement;
    searchInput.value = 'chemistry';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 of 6 exams');
    expect(fixture.nativeElement.textContent).toContain('Chemistry Final');
    expect(fixture.nativeElement.textContent).not.toContain('Physics Exam 1');
  });

  it('keeps all group detail tabs selectable after adding exams', async () => {
    for (const tab of ['sessions', 'enrolledStudents', 'lessons', 'library', 'exams', 'overview'] as const) {
      fixture.componentInstance.selectTab(tab);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.activeTab()).toBe(tab);
    }
  });

  it('resets exams rows, search text, and pagination when the loaded group changes', async () => {
    groupDetailsData.loadGroupExams.mockReturnValue(of([
      {
        id: 'assignment-1',
        groupId: 'group-123',
        examId: 'exam-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        date: '2026-07-01',
        startTime: '09:30',
        duration: 60,
        questionCount: 24,
        instructions: null,
        updatedAt: null,
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      },
    ]));
    fixture.componentInstance.selectTab('exams');
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.setExamSearchTerm('physics');
    fixture.componentInstance.examPageIndex.set(1);
    fixture.componentInstance.selectTab('sessions');

    group.set({ ...initialGroup, id: 'group-456', name: 'Chemistry G12-A' });
    fixture.detectChanges();

    expect(fixture.componentInstance.groupExams()).toEqual([]);
    expect(fixture.componentInstance.examSearchTerm()).toBe('');
    expect(fixture.componentInstance.examPageIndex()).toBe(0);
    expect(fixture.componentInstance.groupExamsLoaded()).toBe(false);
  });

  it('switches to the library tab and renders the library panel', async () => {
    const libraryTab = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Library')) as HTMLButtonElement;

    libraryTab.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.activeTab()).toBe('library');
    expect(fixture.nativeElement.querySelector('#tenant-group-library-panel')).toBeTruthy();
    expect(text).toContain('Group learning resources and shared materials');
    expect(text).toContain('No library resources added yet.');
  });

  it('loads group library folders after a refreshed library tab waits for group details', async () => {
    groupDetailsData.loadGroupLibraryFolders.mockClear();
    groupDetailsData.loadGroupLibraryFolders.mockReturnValue(of([
      {
        id: 'folder-1',
        name: 'Saved folder',
        description: null,
        fileTypes: [],
        filesCount: 0,
        createdAt: '',
        updatedAt: '',
      },
    ]));

    group.set(null);
    fixture.componentInstance.selectTab('library');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupDetailsData.loadGroupLibraryFolders).not.toHaveBeenCalled();

    group.set(initialGroup);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(groupDetailsData.loadGroupLibraryFolders).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
    expect(fixture.nativeElement.textContent).toContain('Saved folder');
  });

  it('keeps curriculum material folders hidden in the library tab', async () => {
    const unitId = '05e26664-b450-471c-a122-03acef617dbe';
    const lessonId = '5c384997-1aa9-4298-8da0-5188b8a6d662';
    subjectsData.getSubjectCurriculumForCategory.mockResolvedValue({
      id: 'curriculum',
      label: 'Physics Curriculum',
      icon: 'folder',
      description: null,
      children: [
        {
          id: unitId,
          label: 'Unit one',
          icon: 'folder',
          description: null,
          children: [
            {
              id: lessonId,
              label: 'Lesson one',
              icon: 'description',
              description: 'Intro lesson',
              children: [],
            },
          ],
        },
      ],
    });
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-lesson-1',
        curriculumNodeId: lessonId,
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
    ]));
    subjectsData.listCurriculumMaterialFolders.mockResolvedValue([
      { id: 'folder-1', name: 'Unit material', description: 'Shared lesson files', fileTypes: [], filesCount: 0, createdAt: '', updatedAt: '' },
    ]);

    fixture.componentInstance.selectTab('library');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(subjectsData.listCurriculumMaterialFolders).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.tenant-group-library-folder-card')).toBeFalsy();
    expect(text).not.toContain('Unit material');
    expect(text).toContain('No library resources added yet.');
  });

  it('creates and opens a library material folder from name and description only', async () => {
    groupDetailsData.createGroupLibraryFolder.mockReturnValue(of({
      id: 'created-folder',
      name: 'Created material',
      description: 'Shared files',
      fileTypes: [],
      filesCount: 0,
      createdAt: '',
      updatedAt: '',
    }));

    fixture.componentInstance.selectTab('library');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const createButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Create folder')) as HTMLButtonElement;
    createButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Curriculum directory');
    const nameInput = fixture.nativeElement.querySelector('input[placeholder="Folder name"]') as HTMLInputElement;
    nameInput.value = 'Created material';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    const descriptionInput = fixture.nativeElement.querySelector('textarea[placeholder="Optional description"]') as HTMLTextAreaElement;
    descriptionInput.value = 'Shared files';
    descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const modalCreateButton = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-insert-content-modal-footer button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Create folder')) as HTMLButtonElement;
    modalCreateButton.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.createCurriculumMaterialFolder).not.toHaveBeenCalled();
    expect(groupDetailsData.createGroupLibraryFolder).toHaveBeenCalledWith('group-123', {
      name: 'Created material',
      description: 'Shared files',
    });
    expect(groupDetailsData.loadGroupLibraryFiles).toHaveBeenCalledWith('group-123', 'created-folder', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryNotes).toHaveBeenCalledWith('group-123', 'created-folder', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryLinks).toHaveBeenCalledWith('group-123', 'created-folder', { scope: 'tenant' });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Created material');
    expect(text).toContain('Add note');
    expect(text).toContain('Add external link');
    expect(text).toContain('Upload file');
    expect(text).toContain('No files have been uploaded to this folder yet.');
    expect(fixture.nativeElement.querySelector('a[href*="/tenant/subjects/"]')).toBeFalsy();
  });

  it('opens library note content in the editor and saves changes when the card is clicked', async () => {
    const folder = {
      nodeId: 'group-123',
      nodeLabel: 'Group Library',
      folder: {
        id: 'folder-1',
        name: 'Shared folder',
        description: null,
        fileTypes: [],
        filesCount: 1,
        createdAt: '',
        updatedAt: '',
      },
    };
    groupDetailsData.loadGroupLibraryNotes.mockReturnValue(of([
      {
        id: 'note-1',
        title: 'Opening note',
        contentJson: JSON.stringify({ blocks: [{ data: { text: 'Preview body' } }] }),
        createdAt: '',
        updatedAt: '',
      },
    ]));
    groupDetailsData.updateGroupLibraryNote.mockReturnValue(of({
      id: 'note-1',
      title: 'Opening note',
      contentJson: JSON.stringify({ blocks: [{ data: { text: 'Updated body' } }] }),
      createdAt: '',
      updatedAt: '',
    }));

    fixture.componentInstance.libraryFolders.set([folder]);
    fixture.componentInstance.activeTab.set('library');
    await fixture.componentInstance.openLibraryFolder(folder);
    fixture.detectChanges();

    const noteCard = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-library-content-card'))
      .find((card) => (card as HTMLElement).textContent?.includes('Opening note')) as HTMLButtonElement;
    noteCard.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editingLibraryNote()?.id).toBe('note-1');
    expect(fixture.nativeElement.textContent).toContain('Edit Note');
    expect((fixture.nativeElement.querySelector('#group-library-note-content') as HTMLTextAreaElement).value).toBe('Preview body');

    fixture.componentInstance.setLibraryNoteContent('Updated body');
    await fixture.componentInstance.saveLibraryNote();
    fixture.detectChanges();

    expect(groupDetailsData.updateGroupLibraryNote).toHaveBeenCalledWith('group-123', 'folder-1', 'note-1', {
      title: 'Opening note',
      contentJson: expect.stringContaining('Updated body'),
    });
    expect(fixture.componentInstance.notePreview(fixture.componentInstance.libraryNotes()[0])).toBe('Updated body');
    expect(fixture.componentInstance.libraryNoteModalOpen()).toBe(false);
  });

  it('switches to the overview tab and renders group summary fields', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T17:15:00'));
    group.set({
      ...initialGroup,
      calendarEvents: [
        {
          id: 'last-session',
          date: '2026-06-17',
          day: 'Wednesday',
          startTime: '14:00',
          endTime: '15:00',
          room: 'Lab 101',
        },
        {
          id: 'current-session',
          date: '2026-06-17',
          day: 'Wednesday',
          startTime: '17:00',
          endTime: '18:00',
          room: 'Lab 102',
        },
      ],
    });
    students.set([
      {
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        attendanceRate: 92,
        lastAttendance: '2026-06-17',
        attendanceState: 'Present',
        attendanceTime: '2026-06-17T17:05:00+03:00',
      },
      {
        id: 'student-2',
        name: 'Sara Mohamed',
        email: 'sara@example.com',
        attendanceRate: 70,
        lastAttendance: '2026-06-17',
        attendanceState: 'Absent',
      },
      {
        id: 'student-3',
        name: 'Omar Hassan',
        email: 'omar@example.com',
        attendanceRate: 0,
        lastAttendance: '',
      },
    ]);
    fixture.detectChanges();
    const overviewTab = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-detail-tab'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Overview')) as HTMLButtonElement;

    overviewTab.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.activeTab()).toBe('overview');
    expect(fixture.nativeElement.querySelector('#tenant-group-overview-panel')).toBeTruthy();
    expect(text).toContain('Group academic and operational summary');
    expect(text).toContain('Current session');
    expect(text).toContain('Wednesday · 2026-06-17 · 17:00 - 18:00');
    expect(text).toContain('Lab 102');
    expect(text).toContain('Last session');
    expect(text).toContain('Wednesday · 2026-06-17 · 14:00 - 15:00');
    expect(text).toContain('Lab 101');
    expect(text).toContain('Attendance 33%');
    expect(text).toContain('Marked');
    expect(text).toContain('Attendance Trend');
    expect(text).toContain('1 present, 1 absent, 1 not marked');
    expect(text).toContain('Current session');
    expect(fixture.nativeElement.querySelector('canvas[aria-label="Current session attendance trend"]')).toBeTruthy();
    expect(text).toContain('2 / 3');
    expect(text).toContain('Present');
    expect(text).toContain('Absent');
    expect(text).toContain('Not marked');
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

  it('displays assigned lessons in the matching session row', async () => {
    groupDetailsData.loadGroupLessons.mockReset();
    groupDetailsData.loadGroupLessons.mockImplementation((_groupId: string, options?: { sessionId?: string | null }) => {
      if (options?.sessionId === 'schedule-Monday') {
        return of([
          {
            id: 'session-lesson-1',
            curriculumNodeId: 'lesson-1',
            title: 'Motion intro',
            path: 'Unit one',
            description: null,
          },
          {
            id: 'session-lesson-2',
            curriculumNodeId: 'lesson-2',
            title: 'Forces practice',
            path: 'Unit one',
            description: null,
          },
          {
            id: 'session-lesson-3',
            curriculumNodeId: 'lesson-3',
            title: 'Energy review',
            path: 'Unit two',
            description: null,
          },
        ]);
      }
      return of([]);
    });
    fixture.componentInstance.sessionLessonsLoadedKey.set(null);
    group.set({ ...initialGroup });

    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-row')) as HTMLElement[];

    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant', sync: false, sessionId: 'schedule-Monday' });
    expect(rows[0].textContent).toContain('Assigned lessons');
    expect(rows[0].textContent).toContain('Motion intro');
    expect(rows[0].textContent).toContain('Forces practice');
    expect(rows[0].textContent).toContain('+1');
    expect(rows[1].textContent).toContain('No lessons assigned');
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

  it('opens the teacher session details page from the teacher group view', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (fixture.componentInstance as unknown as { isTeacherGroupView: boolean; groupListRoute: string }).isTeacherGroupView = true;
    (fixture.componentInstance as unknown as { isTeacherGroupView: boolean; groupListRoute: string }).groupListRoute = '/teacher/groups';
    fixture.componentInstance.selectTab('sessions');
    fixture.detectChanges();

    const firstSessionRow = fixture.nativeElement.querySelector('.tenant-group-session-row') as HTMLElement;
    firstSessionRow.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/teacher/groups', 'group-123', 'sessions', 'schedule-Monday']);
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
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
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
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
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
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
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

  it('opens lesson session assignment in place from the lesson row icon', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    groupDetailsData.loadGroupLessons.mockImplementation((_groupId: string, options?: { sessionId?: string | null }) => {
      if (options?.sessionId) {
        return of([
          {
            id: 'assigned-lesson-2',
            curriculumNodeId: 'lesson-2',
            title: 'Already assigned lesson',
            path: 'Unit two',
            description: null,
          },
        ]);
      }
      return of([
        {
          id: 'group-lesson-1',
          curriculumNodeId: 'lesson-1',
          title: 'Lesson one',
          path: 'Unit one',
          description: 'Intro lesson',
        },
      ]);
    });

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const assignButton = fixture.nativeElement.querySelector('[aria-label="Assign lesson to session"]') as HTMLButtonElement;
    assignButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant', sync: false, sessionId: 'schedule-Monday' });
    expect(fixture.nativeElement.textContent).toContain('Physics G12-A sessions');
    expect(fixture.nativeElement.textContent).toContain('Already assigned lesson');

    const sessionButton = fixture.nativeElement.querySelector('.tenant-group-assign-session-card') as HTMLButtonElement;
    sessionButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(assignButton).toBeTruthy();
    expect(groupDetailsData.addGroupLesson).toHaveBeenCalledWith('group-123', 'lesson-1', { sessionId: 'schedule-Monday' });
    expect(fixture.nativeElement.textContent).toContain('Assigned');
  });

  it('opens lesson insert content from the lesson row icon', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const unitId = '11111111-1111-4111-8111-111111111111';
    const lessonId = '22222222-2222-4222-8222-222222222222';
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-lesson-1',
        curriculumNodeId: lessonId,
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
    ]));
    subjectsData.getSubjectCurriculumForCategory.mockResolvedValue({
      id: 'curriculum',
      label: 'Physics Curriculum',
      icon: 'folder',
      description: null,
      children: [
        {
          id: unitId,
          label: 'Unit one',
          icon: 'folder',
          description: null,
          children: [
            {
              id: lessonId,
              label: 'Lesson one',
              icon: 'description',
              description: 'Intro lesson',
              children: [],
            },
          ],
        },
      ],
    });
    groupDetailsData.loadGroupLibraryFolders.mockReturnValue(of([
      { id: 'folder-1', name: 'Group library material', description: null, fileTypes: ['pdf'], filesCount: 1, createdAt: '', updatedAt: '' },
      { id: 'folder-2', name: 'External Books', description: null, fileTypes: ['pdf'], filesCount: 1, createdAt: '', updatedAt: '' },
    ]));
    groupDetailsData.loadGroupLibraryFiles.mockImplementation((_groupId, folderId) => of(folderId === 'folder-2'
      ? [{ id: 'file-2', url: '/uploads/system.pdf', fileName: 'system.pdf', originalName: 'system.pdf', contentType: 'application/pdf', sizeBytes: 4096, createdAt: '', updatedAt: '' }]
      : [{ id: 'file-1', url: '/uploads/intro.pdf', fileName: 'intro.pdf', originalName: 'intro.pdf', contentType: 'application/pdf', sizeBytes: 2048, createdAt: '', updatedAt: '' }]));

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const insertButton = fixture.nativeElement.querySelector('[aria-label="Insert content"]') as HTMLButtonElement;
    insertButton.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(groupDetailsData.loadGroupLessonContent).toHaveBeenCalledWith('group-123', 'group-lesson-1', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryFolders).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryFiles).toHaveBeenCalledWith('group-123', 'folder-1', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryFiles).toHaveBeenCalledWith('group-123', 'folder-2', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryNotes).toHaveBeenCalledWith('group-123', 'folder-1', { scope: 'tenant' });
    expect(groupDetailsData.loadGroupLibraryLinks).toHaveBeenCalledWith('group-123', 'folder-1', { scope: 'tenant' });
    expect(subjectsData.listCurriculumMaterialFolders).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Insert content');
    expect(fixture.nativeElement.textContent).toContain('intro.pdf');

    const folderFilter = fixture.nativeElement.querySelector('.tenant-group-insert-content-folder-filter select') as HTMLSelectElement;
    folderFilter.value = 'folder-2';
    folderFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('intro.pdf');
    expect(fixture.nativeElement.textContent).toContain('system.pdf');

    const materialOption = fixture.nativeElement.querySelector('.tenant-group-insert-content-option') as HTMLButtonElement;
    materialOption.click();
    fixture.detectChanges();

    const insertSelectedButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Insert selected')) as HTMLButtonElement;
    insertSelectedButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupDetailsData.addGroupLessonContent).toHaveBeenCalledWith('group-123', 'group-lesson-1', {
      curriculumNodeId: lessonId,
      folderId: 'folder-2',
      contentType: 'FILE',
      contentId: 'file-2',
    });
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
            {
              id: 'lesson-2',
              label: 'Lesson two',
              icon: 'description',
              description: null,
              children: [],
            },
          ],
        },
      ],
    });

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

  it('hides persisted curriculum parent nodes from the lessons table', async () => {
    groupDetailsData.loadGroupLessons.mockReturnValue(of([
      {
        id: 'group-unit-2',
        curriculumNodeId: 'unit-2',
        title: 'Unit 2',
        path: 'Physics Curriculum',
        description: null,
      },
      {
        id: 'group-lesson-1',
        curriculumNodeId: 'lesson-1',
        title: 'Lesson one',
        path: 'Unit one',
        description: 'Intro lesson',
      },
    ]));
    groupDetailsData.addGroupLesson.mockImplementation((_groupId: string, nodeId: string) => of({
      id: `group-${nodeId}`,
      curriculumNodeId: nodeId,
      title: nodeId === 'lesson-2' ? 'Lesson two' : 'Lesson one',
      path: nodeId === 'lesson-2' ? 'Unit 2' : 'Unit one',
      description: null,
    }));
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
        {
          id: 'unit-2',
          label: 'Unit 2',
          icon: 'folder',
          description: null,
          children: [
            {
              id: 'lesson-2',
              label: 'Lesson two',
              icon: 'description',
              description: null,
              children: [],
            },
          ],
        },
      ],
    });

    fixture.componentInstance.selectTab('lessons');
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('#tenant-group-lessons-panel tbody tr')) as HTMLElement[];
    const rowTitles = rows.map((row) => row.querySelector('strong')?.textContent?.trim());
    expect(rowTitles).toEqual(['Lesson one', 'Lesson two']);
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

    expect(groupDetailsData.loadGroupLessons).toHaveBeenCalledWith('group-123', { scope: 'tenant' });
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
    expect(text).toContain('Display payment status');
    expect(text).toContain('Schedule Details');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('Attendance');
    expect(text).toContain('Exam');
    expect(text).toContain('Broadcast');
    expect(text).toContain('Calendar');
    expect(text).toContain('Report');
  });

  it('toggles display payment status for the current group', () => {
    const switchButton = fixture.nativeElement.querySelector('[role="switch"][aria-label="Display payment status"]') as HTMLButtonElement;

    expect(switchButton).toBeTruthy();
    expect(switchButton.getAttribute('aria-checked')).toBe('false');
    expect(switchButton.textContent).toContain('Off');

    switchButton.click();
    fixture.detectChanges();

    expect(switchButton.getAttribute('aria-checked')).toBe('true');
    expect(switchButton.textContent).toContain('On');
    expect(localStorage.getItem('tenant-group:group-123:display-payment-status')).toBe('true');
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
    expect((fixture.nativeElement.textContent as string)).toContain('Parent Ali');
    expect((fixture.nativeElement.textContent as string)).toContain('+201111111111');
    expect((fixture.nativeElement.textContent as string)).toContain('Remove from group');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Financial Status');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Forbid Attendance');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Set Inactive');
    expect((fixture.nativeElement.textContent as string)).not.toContain('18 Sessions');
    expect((fixture.nativeElement.textContent as string)).not.toContain('Feb 15, 2026');
  });

  it('uses the selected student attendance values in the profile drawer', () => {
    selectedStudent.set(initialStudents[1]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('87%');
    expect(text).toContain('13%');
    expect(text).toContain('Present on 2026-05-31');
  });

  it('runs the real remove enrollment action from the student profile drawer', () => {
    selectedStudent.set(initialStudents[0]);
    fixture.detectChanges();

    const removeButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Remove from group')) as HTMLButtonElement;

    removeButton.click();
    fixture.detectChanges();

    expect(facade.removeStudentFromGroup).toHaveBeenCalledWith('group-123', initialStudents[0]);
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
