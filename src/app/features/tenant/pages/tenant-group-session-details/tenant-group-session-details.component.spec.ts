import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GroupDetails } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantGroupSessionDetailsComponent } from './tenant-group-session-details.component';

describe('TenantGroupSessionDetailsComponent', () => {
  let fixture: ComponentFixture<TenantGroupSessionDetailsComponent>;
  let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  const lessonNodeId = '11111111-1111-4111-8111-111111111111';
  const group: GroupDetails = {
    id: 'group-123',
    name: 'Physics G12-A',
    subjectId: 'subject-1',
    educationCategory: 'BASIC_EDUCATION',
    stageName: 'Secondary',
    gradeName: 'Grade 12',
    subject: 'Physics',
    teacher: 'Sarah Nabil',
    room: 'Lab 101',
    schedule: 'Monday 10:00',
    capacity: 25,
    enrolled: 3,
    fees: 500,
    status: 'Active',
    monthlyRevenue: 1500,
    currency: 'EGP',
    startAt: '10:00',
    duration: 90,
    daySchedules: {},
    scheduleDays: [],
    students: [
      {
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        barcodeNumber: '30001',
        attendanceRate: 92,
        lastAttendance: '2026-06-05 10:05',
        attendanceState: 'Present',
      },
      {
        id: 'student-2',
        name: 'Sara Mohamed',
        email: 'sara@example.com',
        barcodeNumber: '30002',
        attendanceRate: 70,
        lastAttendance: '2026-06-04',
        attendanceState: null,
      },
    ],
    calendarEvents: [
      {
        id: 'event-1',
        date: '2026-06-06',
        day: 'Saturday',
        startTime: '10:00',
        endTime: '11:00',
        room: 'Room B',
      },
    ],
  };
  const data = {
    loadGroupById: vi.fn(),
    loadGroupLessons: vi.fn(),
    loadGroupLessonContent: vi.fn(),
    addGroupLesson: vi.fn(),
    deleteGroupLesson: vi.fn(),
    updateGroupLessonCompletion: vi.fn(),
    loadGroupLibraryFolders: vi.fn(),
    loadGroupLibraryFiles: vi.fn(),
    loadGroupLibraryNotes: vi.fn(),
    loadGroupSessionLibraryContent: vi.fn(),
    addGroupSessionLibraryContent: vi.fn(),
    deleteGroupSessionLibraryContent: vi.fn(),
    updateGroupSessionLibraryContentCompletion: vi.fn(),
  };
  const attendanceData = {
    scanBarcode: vi.fn(),
    saveManualAttendance: vi.fn(),
  };
  const http = {
    get: vi.fn(),
  };
  const subjectsData = {
    getSubjectCurriculumForCategory: vi.fn(),
    listCurriculumMaterialFolders: vi.fn(),
    listCurriculumMaterialFiles: vi.fn(),
    listCurriculumMaterialNotes: vi.fn(),
    listCurriculumMaterialLinks: vi.fn(),
  };

  beforeAll(() => {
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: () => 'blob:missing',
      });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: () => undefined,
      });
    }
  });

  beforeEach(async () => {
    createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-pdf');
    revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    data.loadGroupById.mockReset();
    data.loadGroupById.mockReturnValue(of(group));
    data.loadGroupLessons.mockReset();
    data.loadGroupLessons.mockReturnValue(of([
      {
        id: 'lesson-1',
        curriculumNodeId: lessonNodeId,
        title: 'Forces and Motion',
        path: 'Physics Curriculum / Unit one',
        description: 'Newton laws introduction',
        completed: false,
      },
      {
        id: 'lesson-2',
        curriculumNodeId: 'curriculum-lesson-2',
        title: 'Acceleration Practice',
        path: 'Physics Curriculum / Unit two',
        description: null,
        completed: false,
      },
    ]));
    data.loadGroupLessonContent.mockReset();
    data.loadGroupLessonContent.mockReturnValue(of([
      {
        id: 'content-1',
        curriculumNodeId: lessonNodeId,
        curriculumNodeLabel: 'Forces and Motion',
        folderId: 'folder-1',
        folderName: 'Lesson files',
        contentType: 'FILE',
        contentId: 'file-1',
        title: 'Newton worksheet.pdf',
        url: '/media/newton-worksheet.pdf',
        fileContentType: 'application/pdf',
        sizeBytes: 2048,
      },
      {
        id: 'content-2',
        curriculumNodeId: lessonNodeId,
        curriculumNodeLabel: 'Forces and Motion',
        folderId: 'folder-1',
        folderName: 'Lesson files',
        contentType: 'NOTE',
        contentId: 'note-1',
        title: 'Class note',
        url: null,
        fileContentType: null,
        sizeBytes: null,
      },
    ]));
    data.addGroupLesson.mockReset();
    data.addGroupLesson.mockReturnValue(of({
      id: 'lesson-3',
      curriculumNodeId: '22222222-2222-4222-8222-222222222222',
      title: 'Energy Transfer',
      path: 'Physics Curriculum / Unit three',
      description: 'Work and energy',
      completed: false,
    }));
    data.deleteGroupLesson.mockReset();
    data.deleteGroupLesson.mockReturnValue(of(null));
    data.updateGroupLessonCompletion.mockReset();
    data.updateGroupLessonCompletion.mockImplementation((_groupId: string, lessonId: string, completed: boolean) =>
      of({
        id: lessonId,
        curriculumNodeId: lessonNodeId,
        title: 'Forces and Motion',
        path: 'Physics Curriculum / Unit one',
        description: 'Newton laws introduction',
        completed,
      }),
    );
    data.loadGroupLibraryFolders.mockReset();
    data.loadGroupLibraryFolders.mockReturnValue(of([
      {
        id: 'library-folder-1',
        name: 'Session resources',
        description: 'Shared group files',
        fileTypes: ['file'],
        filesCount: 3,
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]));
    data.loadGroupLibraryFiles.mockReset();
    data.loadGroupLibraryFiles.mockReturnValue(of([
      {
        id: 'library-file-1',
        url: '/media/session-brief.pdf',
        fileName: 'session-brief.pdf',
        originalName: 'Session brief.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2048,
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
      {
        id: 'library-file-2',
        url: '/media/session-image.png',
        fileName: 'session-image.png',
        originalName: 'Session image.png',
        contentType: 'image/png',
        sizeBytes: 1024,
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]));
    data.loadGroupLibraryNotes.mockReset();
    data.loadGroupLibraryNotes.mockReturnValue(of([
      {
        id: 'library-note-1',
        title: 'Session note',
        contentJson: JSON.stringify({ blocks: [{ data: { text: 'Session note body' } }] }),
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]));
    data.loadGroupSessionLibraryContent.mockReset();
    data.loadGroupSessionLibraryContent.mockReturnValue(of([]));
    data.addGroupSessionLibraryContent.mockReset();
    data.addGroupSessionLibraryContent.mockImplementation((_groupId: string, payload: { sessionId: string | null; folderId: string; contentType: 'FILE' | 'NOTE' | 'LINK'; contentId: string }) => {
      const isNote = payload.contentType === 'NOTE';
      const isImage = payload.contentId === 'library-file-2';
      return of({
        id: `session-library-${payload.contentId}`,
        sessionId: payload.sessionId,
        folderId: payload.folderId,
        folderName: 'Session resources',
        contentType: payload.contentType,
        contentId: payload.contentId,
        title: isNote ? 'Session note' : isImage ? 'Session image.png' : 'Session brief.pdf',
        url: isNote ? null : isImage ? '/media/session-image.png' : '/media/session-brief.pdf',
        fileContentType: isNote ? null : isImage ? 'image/png' : 'application/pdf',
        sizeBytes: isNote ? null : isImage ? 1024 : 2048,
        completed: false,
      });
    });
    data.deleteGroupSessionLibraryContent.mockReset();
    data.deleteGroupSessionLibraryContent.mockReturnValue(of(null));
    data.updateGroupSessionLibraryContentCompletion.mockReset();
    data.updateGroupSessionLibraryContentCompletion.mockImplementation((_groupId: string, contentId: string, completed: boolean) =>
      of({
        id: contentId,
        sessionId: 'event-1',
        folderId: 'library-folder-1',
        folderName: 'Session resources',
        contentType: 'FILE',
        contentId: 'library-file-1',
        title: 'Session brief.pdf',
        url: '/media/session-brief.pdf',
        fileContentType: 'application/pdf',
        sizeBytes: 2048,
        completed,
      }),
    );
    http.get.mockReset();
    http.get.mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' })));
    attendanceData.scanBarcode.mockReset();
    attendanceData.saveManualAttendance.mockReset();
    attendanceData.saveManualAttendance.mockImplementation((request: { groupId: string; studentId: string; attendanceState: 'Present' | 'Absent' }) =>
      of({
        groupId: request.groupId,
        studentId: request.studentId,
        attendanceState: request.attendanceState,
        source: 'Manual',
        scanTime: '2026-06-11T05:07:00',
        sessionDate: '2026-06-11',
        message: 'Manual attendance saved',
      }),
    );
    subjectsData.getSubjectCurriculumForCategory.mockReset();
    subjectsData.getSubjectCurriculumForCategory.mockResolvedValue({
      id: 'root',
      label: 'Physics Curriculum',
      icon: 'folder',
      children: [
        {
          id: lessonNodeId,
          label: 'Forces and Motion',
          icon: 'menu_book',
          children: [],
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          label: 'Energy Transfer',
          icon: 'menu_book',
          description: 'Work and energy',
          children: [],
        },
      ],
    });
    subjectsData.listCurriculumMaterialFolders.mockReset();
    subjectsData.listCurriculumMaterialFolders.mockResolvedValue([
      {
        id: 'folder-2',
        name: 'Direct material',
        position: 0,
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]);
    subjectsData.listCurriculumMaterialFiles.mockReset();
    subjectsData.listCurriculumMaterialFiles.mockResolvedValue([
      {
        id: 'file-2',
        url: '/media/direct-slide.pdf',
        fileName: 'direct-slide.pdf',
        originalName: 'Direct slide.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]);
    subjectsData.listCurriculumMaterialNotes.mockReset();
    subjectsData.listCurriculumMaterialNotes.mockImplementation(async (_subjectId: string, _nodeId: string, folderId: string) => {
      if (folderId !== 'folder-1') {
        return [];
      }
      return [
        {
          id: 'note-1',
          title: 'Class note',
          contentJson: JSON.stringify({
            blocks: [
              {
                data: {
                  text: 'Newton note content',
                },
              },
            ],
          }),
          createdAt: '2026-06-11T00:00:00',
          updatedAt: '2026-06-11T00:00:00',
        },
      ];
    });
    subjectsData.listCurriculumMaterialLinks.mockReset();
    subjectsData.listCurriculumMaterialLinks.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [TenantGroupSessionDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123', sessionId: 'event-1' }),
            },
          },
        },
        { provide: HttpClient, useValue: http },
        { provide: TenantGroupDetailsDataService, useValue: data },
        { provide: TenantGroupAttendanceDataService, useValue: attendanceData },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupSessionDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it('renders the selected group session details', async () => {
    const text = fixture.nativeElement.textContent as string;
    const statCards = fixture.nativeElement.querySelectorAll('.tenant-group-session-stat-card');

    expect(data.loadGroupById).toHaveBeenCalledWith('group-123');
    expect(data.loadGroupLessons).toHaveBeenCalledWith('group-123', { sync: false, sessionId: 'event-1' });
    expect(data.loadGroupSessionLibraryContent).toHaveBeenCalledWith('group-123', 'event-1');
    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Saturday');
    expect(text).toContain('Physics');
    expect(text).toContain('Dated session');
    expect(text).toContain('Session 1');
    expect(text).toContain('Saturday, Jun 6, 2026');
    expect(text).toContain('10:00 AM - 11:00 AM');
    expect(text).toContain('1h');
    expect(text).toContain('Room B');
    expect(text).toContain('Sarah Nabil');
    expect(text).toContain('3 / 25');
    expect(text).toContain('Total Students');
    expect(text).toContain('Time');
    expect(text).toContain('10:00 AM to 11:00 AM');
    expect(text).toContain('Status');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('Attendance');
    expect(text).toContain('Exam');
    expect(text).toContain('Broadcast');
    expect(text).toContain('Calendar');
    expect(text).toContain('Report');
    expect(text).toContain('Secondary');
    expect(text).toContain('Grade 12');
    expect(text).toContain('Open attendance');
    expect(statCards[1].textContent).toMatch(/Absent\s*1/);
    expect(statCards[2].textContent).toMatch(/Present\s*1/);
    expect(text).toContain('Students');
    expect(text).toContain('2 of 2 enrolled students');
    expect(text).toContain('Read Barcode Data Input');
    expect(text).toContain('Barcode');
    expect(text).toContain('Attendance time');
    expect(text).toContain('Action');
    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('ahmed@example.com');
    expect(text).toContain('30001');
    expect(text).toContain('Present');
    expect(text).toContain('10:05');
    expect(text).toContain('Sara Mohamed');
    expect(text).toContain('Absent');
    expect(text).toContain('Not recorded');
    expect(text).not.toContain('Attendance\n');
    const assessmentLink = fixture.nativeElement.querySelector('[aria-label="Student assessment"]') as HTMLAnchorElement;
    expect(assessmentLink).toBeTruthy();
    expect(assessmentLink.getAttribute('href')).toContain('/tenant/groups/group-123/sessions/event-1/students/student-1/assessment');
    expect(text).toContain('Lessons');
    expect(text).toContain('2 inserted lessons linked to this session');
    expect(text).toContain('From library');
    expect(text).toContain('Insert lesson');
    expect(text).toContain('Showing 1-2 of 2 lessons');
    expect(text).toContain('Page 1 of 1');
    expect(text).toContain('Forces and Motion');
    expect(text).toContain('Newton laws introduction');
    expect(text).toContain('Acceleration Practice');
    expect(text).toContain('No description');
    expect(fixture.nativeElement.querySelector('[aria-label="Remove lesson"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Mark lesson as complete"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Choose from library"]')).toBeTruthy();

    const lessonToggle: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-row-toggler');
    expect(lessonToggle.getAttribute('aria-expanded')).toBe('false');
    lessonToggle.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedText = fixture.nativeElement.textContent as string;
    expect(data.loadGroupLessonContent).toHaveBeenCalledWith('group-123', 'lesson-1');
    expect(lessonToggle.getAttribute('aria-expanded')).toBe('true');
    expect(updatedText).toContain('Lesson Material');
    expect(updatedText).toContain('Newton worksheet.pdf');
    expect(updatedText).toContain('Class note');
    expect(updatedText).toContain('Direct slide.pdf');
    expect(updatedText).toContain('Direct material');
    expect(updatedText).toContain('Lesson files');
    expect(updatedText).toContain('2 KB');

    const materialButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-material-item');
    materialButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('.tenant-group-session-preview-overlay');
    const previewFrame: HTMLIFrameElement = fixture.nativeElement.querySelector('.tenant-group-session-drawer-file-frame');
    expect(http.get).toHaveBeenCalledWith('/media/newton-worksheet.pdf', { responseType: 'blob' });
    expect(drawer).toBeTruthy();
    expect(previewFrame).toBeTruthy();
    expect(previewFrame.getAttribute('title')).toBe('Newton worksheet.pdf');

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-preview-header button');
    closeButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tenant-group-session-preview-overlay')).toBeFalsy();

    const materialButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.tenant-group-session-material-item');
    materialButtons[1].click();
    await fixture.whenStable();
    fixture.detectChanges();

    const noteDrawerText = fixture.nativeElement.textContent as string;
    expect(subjectsData.listCurriculumMaterialNotes).toHaveBeenCalledWith('subject-1', lessonNodeId, 'folder-1', 'BASIC_EDUCATION');
    expect(noteDrawerText).toContain('Class note');
    expect(noteDrawerText).toContain('Newton note content');
  });

  it('removes a lesson from the session lessons table', async () => {
    const removeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-icon-action--danger');
    removeButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(data.deleteGroupLesson).toHaveBeenCalledWith('group-123', 'lesson-1');
    expect(text).toContain('1 inserted lessons linked to this session');
    expect(text).not.toContain('Forces and Motion');
    expect(text).toContain('Acceleration Practice');
  });

  it('marks a lesson complete and disables its delete action', async () => {
    const completeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-icon-action--complete');
    completeButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedCompleteButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-icon-action--complete');
    const removeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tenant-group-session-icon-action--danger');
    expect(data.updateGroupLessonCompletion).toHaveBeenCalledWith('group-123', 'lesson-1', true);
    expect(updatedCompleteButton.getAttribute('aria-label')).toBe('Mark lesson as incomplete');
    expect(removeButton.disabled).toBe(true);
  });

  it('opens the from library modal, expands a folder, and selects multiple files and notes', async () => {
    const libraryButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('From library')) as HTMLButtonElement;

    libraryButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.loadGroupLibraryFolders).toHaveBeenCalledWith('group-123');
    expect(fixture.nativeElement.textContent).toContain('Choose folder');
    expect(fixture.nativeElement.textContent).toContain('Session resources');
    expect(fixture.nativeElement.textContent).toContain('3 items');

    const folderOption = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((option) => (option as HTMLElement).textContent?.includes('Session resources')) as HTMLButtonElement;
    folderOption.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.loadGroupLibraryFiles).toHaveBeenCalledWith('group-123', 'library-folder-1');
    expect(data.loadGroupLibraryNotes).toHaveBeenCalledWith('group-123', 'library-folder-1');
    expect(fixture.componentInstance.selectedLibraryFolder()?.id).toBe('library-folder-1');
    expect(fixture.nativeElement.textContent).toContain('Session brief.pdf');
    expect(fixture.nativeElement.textContent).toContain('Session image.png');
    expect(fixture.nativeElement.textContent).toContain('Session note');

    folderOption.click();
    fixture.detectChanges();
    expect(folderOption.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.textContent).not.toContain('Session brief.pdf');
    expect(fixture.nativeElement.textContent).not.toContain('Session note');

    folderOption.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(folderOption.getAttribute('aria-expanded')).toBe('true');

    const contentButtons = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .filter((button) => {
        const text = (button as HTMLButtonElement).textContent ?? '';
        return text.includes('Session brief.pdf') || text.includes('Session image.png') || text.includes('Session note');
      }) as HTMLButtonElement[];
    contentButtons[0].click();
    contentButtons[1].click();
    contentButtons[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedLibraryItemCount()).toBe(3);
    const chooseButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Choose items')) as HTMLButtonElement;
    expect(chooseButton.disabled).toBe(false);
    expect(chooseButton.textContent).toContain('(3)');

    chooseButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.addGroupSessionLibraryContent).toHaveBeenCalledTimes(3);
    expect(data.addGroupSessionLibraryContent).toHaveBeenCalledWith('group-123', {
      sessionId: 'event-1',
      folderId: 'library-folder-1',
      contentType: 'FILE',
      contentId: 'library-file-1',
    });
    expect(data.addGroupSessionLibraryContent).toHaveBeenCalledWith('group-123', {
      sessionId: 'event-1',
      folderId: 'library-folder-1',
      contentType: 'NOTE',
      contentId: 'library-note-1',
    });
    expect(fixture.componentInstance.sessionLibraryContent().map((content) => content.title)).toEqual(['Session brief.pdf', 'Session image.png', 'Session note']);
    expect(fixture.componentInstance.selectedLibraryItemCount()).toBe(0);
    const tableRows = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-lessons-table tbody tr')) as HTMLElement[];
    expect(tableRows.some((row) => row.textContent?.includes('Session brief.pdf') && row.textContent.includes('Library file'))).toBe(true);
    expect(tableRows.some((row) => row.textContent?.includes('Session image.png') && row.textContent.includes('Library file'))).toBe(true);
    expect(tableRows.some((row) => row.textContent?.includes('Session note') && row.textContent.includes('Library note'))).toBe(true);
    expect(fixture.nativeElement.querySelector('[aria-label="Preview library content"]')).toBeTruthy();
    const completeButton = fixture.nativeElement.querySelector('[aria-label="Mark library content as complete"]') as HTMLButtonElement;
    const deleteButton = fixture.nativeElement.querySelector('[aria-label="Remove library content"]') as HTMLButtonElement;
    expect(completeButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();

    completeButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.updateGroupSessionLibraryContentCompletion).toHaveBeenCalledWith('group-123', 'session-library-library-file-1', true);
    expect((fixture.nativeElement.querySelector('[aria-label="Remove library content"]') as HTMLButtonElement).disabled).toBe(true);

    await fixture.componentInstance.removeSessionLibraryContent(fixture.componentInstance.sessionLibraryContent()[1]);
    fixture.detectChanges();
    expect(data.deleteGroupSessionLibraryContent).toHaveBeenCalledWith('group-123', 'session-library-library-file-2');
    expect(fixture.componentInstance.sessionLibraryContent().map((content) => content.title)).toEqual(['Session brief.pdf', 'Session note']);
  });

  it('loads persisted library note body when previewing after refresh', async () => {
    data.loadGroupSessionLibraryContent.mockReturnValue(of([
      {
        id: 'session-library-note-1',
        sessionId: 'event-1',
        folderId: 'library-folder-1',
        folderName: 'Session resources',
        contentType: 'NOTE',
        contentId: 'library-note-1',
        title: 'Session note',
        url: null,
        fileContentType: null,
        sizeBytes: null,
        completed: false,
      },
    ]));
    data.loadGroupLibraryNotes.mockReturnValue(of([
      {
        id: 'library-note-1',
        title: 'Session note',
        contentJson: JSON.stringify({ blocks: [{ data: { text: 'Persisted note body' } }] }),
        createdAt: '2026-06-11T00:00:00',
        updatedAt: '2026-06-11T00:00:00',
      },
    ]));

    fixture.destroy();
    fixture = TestBed.createComponent(TenantGroupSessionDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const previewButton = fixture.nativeElement.querySelector('[aria-label="Preview library content"]') as HTMLButtonElement;
    previewButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.loadGroupLibraryNotes).toHaveBeenCalledWith('group-123', 'library-folder-1');
    expect(fixture.componentInstance.previewError()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Persisted note body');
  });

  it('inserts a selected curriculum lesson without auto syncing session lessons', async () => {
    const insertButton = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-insert-lesson-btn'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Insert lesson')) as HTMLButtonElement;

    insertButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(subjectsData.getSubjectCurriculumForCategory).toHaveBeenCalledWith('subject-1', 'BASIC_EDUCATION');
    expect(fixture.nativeElement.textContent).toContain('Forces and Motion');
    expect(fixture.nativeElement.textContent).toContain('Energy Transfer');
    expect(fixture.nativeElement.textContent).toContain('Search');
    expect(fixture.nativeElement.textContent).toContain('Filter');
    expect(fixture.nativeElement.textContent).toContain('Inserted');

    const options = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-lesson-picker-option')) as HTMLButtonElement[];
    const energyOption = options.find((option) => option.textContent?.includes('Energy Transfer')) as HTMLButtonElement;
    energyOption.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(data.addGroupLesson).toHaveBeenCalledWith('group-123', '22222222-2222-4222-8222-222222222222', { sessionId: 'event-1' });
    expect(text).toContain('3 inserted lessons linked to this session');
    expect(text).toContain('Energy Transfer');
    expect(text).not.toContain('Choose a curriculum lesson to add to this session table.');
  });

  it('filters insert lesson modal options by search text and inserted status', async () => {
    const insertButton = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-session-insert-lesson-btn'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Insert lesson')) as HTMLButtonElement;

    insertButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('.tenant-group-session-lesson-picker-tools input');
    searchInput.value = 'energy';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    let modalBody = fixture.nativeElement.querySelector('.tenant-group-session-modal-body') as HTMLElement;
    expect(modalBody.textContent).not.toContain('Forces and Motion');
    expect(modalBody.textContent).toContain('Energy Transfer');

    const statusFilter: HTMLSelectElement = fixture.nativeElement.querySelector('.tenant-group-session-lesson-picker-tools select');
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    statusFilter.value = 'available';
    statusFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    modalBody = fixture.nativeElement.querySelector('.tenant-group-session-modal-body') as HTMLElement;
    expect(modalBody.textContent).not.toContain('Forces and Motion');
    expect(modalBody.textContent).toContain('Energy Transfer');

    statusFilter.value = 'inserted';
    statusFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    modalBody = fixture.nativeElement.querySelector('.tenant-group-session-modal-body') as HTMLElement;
    expect(modalBody.textContent).toContain('Forces and Motion');
    expect(modalBody.textContent).not.toContain('Energy Transfer');
  });

  it('submits barcode scans with the selected group and updates the student row', async () => {
    attendanceData.scanBarcode.mockReturnValue(
      of({
        result: 'PRESENT_RECORDED',
        message: 'Attendance recorded',
        student: { id: 'student-2', name: 'Sara Mohamed', barcodeNumber: '30002' },
        group: { id: 'group-123', name: 'Physics G12-A', startTime: '10:00', duration: 60 },
        attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-11T05:05:00', sessionDate: '2026-06-11' },
      }),
    );

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#session-barcode-input');
    input.value = '30002';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const rows = fixture.nativeElement.querySelectorAll('.tenant-group-session-table-card:first-child tbody tr');
    const statCards = fixture.nativeElement.querySelectorAll('.tenant-group-session-stat-card');
    expect(attendanceData.scanBarcode).toHaveBeenCalledWith({ barcodeNumber: '30002', selectedGroupId: 'group-123' });
    expect(text).toContain('Attendance recorded');
    expect(statCards[1].textContent).toMatch(/Absent\s*0/);
    expect(statCards[2].textContent).toMatch(/Present\s*2/);
    expect(rows[1].textContent).toContain('Sara Mohamed');
    expect(rows[1].textContent).toContain('Present');
    expect(rows[1].textContent).toContain('05:05');
    expect(rows[1].textContent).not.toContain('2026-06-11T05:05:00');
    expect(rows[1].textContent).not.toContain('Absent');
  });

  it('changes student status from the table and saves manual attendance', async () => {
    fixture.componentInstance.currentTime.set(new Date('2026-06-06T10:15:00'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.tenant-group-session-table-card:first-child tbody tr');
    const saraStatusButton = Array.from(rows[1].querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Absent'),
    ) as HTMLButtonElement;

    saraStatusButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedRows = fixture.nativeElement.querySelectorAll('.tenant-group-session-table-card:first-child tbody tr');
    expect(attendanceData.saveManualAttendance).toHaveBeenCalledWith({
      groupId: 'group-123',
      studentId: 'student-2',
      attendanceState: 'Present',
    });
    expect(fixture.nativeElement.textContent).toContain('Manual attendance saved');
    expect(updatedRows[1].textContent).toContain('Sara Mohamed');
    expect(updatedRows[1].textContent).toContain('Present');
    expect(updatedRows[1].textContent).toContain('05:07');
    expect(updatedRows[1].textContent).not.toContain('Absent');
  });

  it('does not change student status when the selected session is not running', async () => {
    fixture.componentInstance.currentTime.set(new Date('2026-06-06T09:15:00'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.tenant-group-session-table-card:first-child tbody tr');
    const saraStatusButton = Array.from(rows[1].querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Absent'),
    ) as HTMLButtonElement;

    expect(saraStatusButton.disabled).toBe(true);
    await fixture.componentInstance.toggleStudentStatus(group.students?.[1] as NonNullable<typeof group.students>[number]);
    fixture.detectChanges();

    expect(attendanceData.saveManualAttendance).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Attendance status can only be changed while this session is running');
    expect(rows[1].textContent).toContain('Sara Mohamed');
    expect(rows[1].textContent).toContain('Absent');
  });

  it('keeps persisted attendance visible after background group refreshes', async () => {
    const refreshedGroup: GroupDetails = {
      ...group,
      students: group.students?.map((student) =>
        student.id === 'student-2'
          ? {
              ...student,
              attendanceState: 'Present',
              attendanceSource: 'Auto',
              lastAttendance: '2026-06-12T02:07:00',
            }
          : student,
      ),
    };

    fixture.destroy();
    data.loadGroupById.mockClear();
    data.loadGroupById.mockReturnValueOnce(of(group)).mockReturnValue(of(refreshedGroup));
    fixture = TestBed.createComponent(TenantGroupSessionDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sara Mohamed');
    expect(fixture.nativeElement.textContent).toContain('Absent');

    await (fixture.componentInstance as unknown as { refreshGroup: () => Promise<void> }).refreshGroup();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.tenant-group-session-table-card:first-child tbody tr');
    expect(data.loadGroupById).toHaveBeenCalledTimes(2);
    expect(rows[1].textContent).toContain('Sara Mohamed');
    expect(rows[1].textContent).toContain('Present');
    expect(rows[1].textContent).toContain('02:07');
    expect(rows[1].textContent).not.toContain('Absent');
  });
});
