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
  };
  const attendanceData = {
    scanBarcode: vi.fn(),
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
    http.get.mockReset();
    http.get.mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' })));
    attendanceData.scanBarcode.mockReset();
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
    expect(text).toContain('Lessons');
    expect(text).toContain('2 inserted lessons linked to this session');
    expect(text).toContain('Insert lesson');
    expect(text).toContain('Showing 1-2 of 2 lessons');
    expect(text).toContain('Page 1 of 1');
    expect(text).toContain('Forces and Motion');
    expect(text).toContain('Newton laws introduction');
    expect(text).toContain('Acceleration Practice');
    expect(text).toContain('No description');
    expect(fixture.nativeElement.querySelector('[aria-label="Remove lesson"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Mark lesson as complete"]')).toBeTruthy();

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
