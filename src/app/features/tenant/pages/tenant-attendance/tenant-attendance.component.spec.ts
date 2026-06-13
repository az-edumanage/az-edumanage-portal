import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { TenantAttendanceStudent } from '../../models/tenant-group-attendance.models';
import { TenantScheduleDataService } from '../../data-access/tenant-schedule-data.service';
import { ScheduleSession } from '../../models/tenant-schedule.models';
import { TenantAttendanceComponent } from './tenant-attendance.component';

describe('TenantAttendanceComponent', () => {
  let fixture: ComponentFixture<TenantAttendanceComponent>;
  let component: TenantAttendanceComponent;
  let scheduleDataService: { loadSessions: ReturnType<typeof vi.fn> };
  let groupAttendanceDataService: {
    getStudentsByGroupId: ReturnType<typeof vi.fn>;
    loadStudentsByGroupId: ReturnType<typeof vi.fn>;
    scanBarcode: ReturnType<typeof vi.fn>;
    saveManualAttendance: ReturnType<typeof vi.fn>;
  };

  const egyptElevenTenPm = new Date('2026-06-04T20:10:00.000Z');
  const egyptFourTwentyTwoPm = new Date('2026-06-04T13:22:00.000Z');
  const egyptFourOhFivePm = new Date('2026-06-04T13:05:00.000Z');
  const egyptFivePm = new Date('2026-06-04T14:00:00.000Z');
  const egyptElevenAm = new Date('2026-06-04T08:00:00.000Z');
  const defaultScheduleSessions: ScheduleSession[] = [
    createScheduleSession({ id: 'physics-g12-a:monday:10:00', groupId: 'physics-g12-a', groupName: 'Physics G12-A', startTime: '10:00' }),
    createScheduleSession({ id: 'chemistry-g11-b:tuesday:11:00', groupId: 'chemistry-g11-b', groupName: 'Chemistry G11-B', startTime: '11:00 AM' }),
    createScheduleSession({ id: 'math-g10-a:wednesday:13:00', groupId: 'math-g10-a', groupName: 'Math G10-A', startTime: '13:00' }),
    createScheduleSession({ id: 'biology-g12-b:thursday:14:00', groupId: 'biology-g12-b', groupName: 'Biology G12-B', startTime: '2:00 PM' }),
    createScheduleSession({ id: 'english-g9-a:friday:23:00', groupId: 'english-g9-a', groupName: 'English G9-A', startTime: '23:00' }),
    createScheduleSession({ id: 'physics-g11-c:saturday:23:00', groupId: 'physics-g11-c', groupName: 'Physics G11-C', startTime: '11:00 PM' }),
  ];

  function createAttendanceStudent(
    id: string,
    name: string,
    isPresent: boolean,
    rfid: string | null,
    barcode: string | null,
  ): TenantAttendanceStudent {
    return {
      id,
      name,
      rfid,
      barcode,
      isPresent,
      attendanceState: isPresent ? 'Present' : 'Absent',
      attendanceTime: '',
      manualStatus: 'Manual',
      overrideChecks: 'Ready',
      attendanceRate: 0,
      totalSessions: 0,
      attendedSessions: 0,
    };
  }

  const mockAttendanceStudentsByGroupId = new Map<string, TenantAttendanceStudent[]>([
    [
      'english-g9-a',
      [
        createAttendanceStudent('english-g9-a-1', 'Ahmed Ali', false, 'RFID-20001', '20001'),
        createAttendanceStudent('english-g9-a-2', 'Sara Mohamed', false, null, '20002'),
      ],
    ],
    [
      'physics-g11-c',
      [
        createAttendanceStudent('physics-g11-c-1', 'Omar Hassan', false, 'RFID-30001', null),
        createAttendanceStudent('physics-g11-c-2', 'Laila Mahmoud', false, 'RFID-30002', '30002'),
      ],
    ],
    [
      'arabic-11-30',
      [
        createAttendanceStudent('arabic-11-30-1', 'Hussein Adel', false, 'RFID-11301', '11301'),
        createAttendanceStudent('arabic-11-30-2', 'Mariam Samir', false, null, '11302'),
      ],
    ],
    ['algebra-11-30', [createAttendanceStudent('algebra-11-30-1', 'Nour Khaled', false, 'RFID-11311', '11311')]],
    ['eleven-thirty', [createAttendanceStudent('eleven-thirty-1', 'Eleven Thirty Student', false, 'RFID-11330', '11330')]],
  ]);

  function createScheduleSession(overrides: Partial<ScheduleSession>): ScheduleSession {
    return {
      id: 'session-1',
      groupId: 'group-1',
      groupName: 'Group 1',
      teacherName: 'Teacher',
      roomName: 'Room 1',
      day: 'Monday',
      startTime: '10:00',
      duration: 60,
      color: 'bg-indigo-500 text-white',
      ...overrides,
    };
  }

  const createComponent = (now: Date = egyptElevenTenPm, sessions: ScheduleSession[] = defaultScheduleSessions): void => {
    scheduleDataService.loadSessions.mockReturnValue(of(sessions));
    fixture = TestBed.createComponent(TenantAttendanceComponent);
    component = fixture.componentInstance;
    component.nowFactory = () => now;
    fixture.detectChanges();
  };

  const getTimeSlotButtons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.time-slot-grid button')) as HTMLButtonElement[];

  const getActiveTimeSlotButton = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.time-slot-active');

  const getSelectedGroupArea = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.selected-group-list, .selected-group-empty');

  const getSelectedGroupItems = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.selected-group-item')) as HTMLElement[];

  const getSelectedGroupsSection = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.selected-groups-section');

  const getSelectedGroupText = (): string => getSelectedGroupArea()?.textContent ?? '';

  const clickTimeSlot = (time: string): void => {
    const button = getTimeSlotButtons().find((timeSlotButton) => timeSlotButton.textContent?.includes(time));

    expect(button).toBeTruthy();
    button?.click();
    fixture.detectChanges();
  };

  const submitBarcode = (barcode: string): void => {
    const input: HTMLInputElement | null = fixture.nativeElement.querySelector('#attendance-barcode-input');
    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('.barcode-input-row button');

    expect(input).toBeTruthy();
    expect(button).toBeTruthy();
    input!.value = barcode;
    input!.dispatchEvent(new Event('input'));
    button!.click();
    fixture.detectChanges();
  };

  const clickFilterGroups = (): void => {
    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('.attendance-hour-card button');

    expect(button).toBeTruthy();
    button?.click();
    fixture.detectChanges();
  };

  const resetMockAttendanceStudents = (): void => {
    mockAttendanceStudentsByGroupId.set('english-g9-a', [
      createAttendanceStudent('english-g9-a-1', 'Ahmed Ali', false, 'RFID-20001', '20001'),
      createAttendanceStudent('english-g9-a-2', 'Sara Mohamed', false, null, '20002'),
    ]);
    mockAttendanceStudentsByGroupId.set('physics-g11-c', [
      createAttendanceStudent('physics-g11-c-1', 'Omar Hassan', false, 'RFID-30001', null),
      createAttendanceStudent('physics-g11-c-2', 'Laila Mahmoud', false, 'RFID-30002', '30002'),
    ]);
  };

  beforeEach(async () => {
    resetMockAttendanceStudents();
    scheduleDataService = { loadSessions: vi.fn() };
    groupAttendanceDataService = {
      getStudentsByGroupId: vi.fn((groupId: string | null) =>
        groupId ? (mockAttendanceStudentsByGroupId.get(groupId) ?? []).map((student) => ({ ...student })) : [],
      ),
      loadStudentsByGroupId: vi.fn((groupId: string | null) =>
        of(groupId ? (mockAttendanceStudentsByGroupId.get(groupId) ?? []).map((student) => ({ ...student })) : []),
      ),
      scanBarcode: vi.fn(),
      saveManualAttendance: vi.fn(({ groupId, studentId, attendanceState }) => {
        const students = mockAttendanceStudentsByGroupId.get(groupId) ?? [];
        mockAttendanceStudentsByGroupId.set(
          groupId,
          students.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  isPresent: attendanceState === 'Present',
                  attendanceState,
                  attendanceTime: '2026-06-04T23:15:00+03:00',
                  manualStatus: 'Manual',
                  overrideChecks: 'Manual override saved',
                }
              : student,
          ),
        );
        return of({
          groupId,
          studentId,
          attendanceState,
          source: 'Manual',
          scanTime: '2026-06-04T23:15:00+03:00',
          sessionDate: '2026-06-04',
          message: 'Manual attendance saved',
        });
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TenantAttendanceComponent],
      providers: [
        provideRouter([]),
        { provide: TenantScheduleDataService, useValue: scheduleDataService },
        { provide: TenantGroupAttendanceDataService, useValue: groupAttendanceDataService },
      ],
    }).compileComponents();
  });

  it('renders the attendance sub navigation under the tenant top bar area', () => {
    createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Academic Attendance');
    expect(text).toContain('TENANT_G2');
    expect(text).toContain('Record Attendance');
    expect(text).toContain('Groups Block');
    expect(text).toContain('Student Roster');
  });

  it('keeps the record attendance tab active', () => {
    createComponent();
    const activeTab: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.tenant-attendance-tab-active');

    expect(activeTab?.getAttribute('href')).toBe('/tenant/attendance');
    expect(activeTab?.getAttribute('aria-current')).toBe('page');
  });

  it('renders the attendance scanner, summary cards, and student table in English', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    const text = fixture.nativeElement.textContent;
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(text).toContain('Study Group Attendance Control Chamber');
    expect(text).toContain('Student Barcode Reader');
    expect(text).toContain('Currently Academic Classes');
    expect(text).toContain('Live Attendance Rate Progress Tracker');
    expect(text).toContain('Physics G11-C');
    expect(text).toContain('MANUAL OVERRIDE CHECK');
    expect(text).not.toContain('Override Checks');
    expect(text).toContain('Ahmed Ali');
    expect(rows.length).toBe(4);
  });

  it('updates student attendance buttons, row state, and progress after marking present', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    const firstPresentButton: HTMLButtonElement = fixture.nativeElement.querySelector('tbody tr .present-button');

    firstPresentButton.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');
    const progressFill: HTMLElement = fixture.nativeElement.querySelector('.attendance-progress-track span');

    expect(firstRow.classList).toContain('student-row-present');
    expect(firstRow.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(firstRow.textContent).toContain('11:15 PM');
    expect(firstRow.querySelector('.present-button-active')).toBeTruthy();
    expect(firstRow.querySelector('.absent-button-active')).toBeFalsy();
    expect(text).toContain('1 / 4');
    expect(text).toContain('1 / 2 Present');
    expect(text).toContain('25%');
    expect(progressFill.style.width).toBe('25%');
  });

  it('submits barcode input and updates the matching student row after a saved scan response', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    groupAttendanceDataService.scanBarcode.mockReturnValue(
      of({
        result: 'PRESENT_RECORDED',
        message: 'Omar Hassan present Physics G11-C',
        student: { id: 'physics-g11-c-1', name: 'Omar Hassan', barcodeNumber: '30001' },
        group: { id: 'physics-g11-c', name: 'Physics G11-C', startTime: '23:00', duration: 60 },
        attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-04T23:15:00+03:00', sessionDate: '2026-06-04' },
      }),
    );
    groupAttendanceDataService.loadStudentsByGroupId.mockReturnValue(
      of([
        {
          ...mockAttendanceStudentsByGroupId.get('physics-g11-c')![0],
          barcode: '30001',
          isPresent: true,
          attendanceState: 'Present',
          attendanceTime: '2026-06-04T23:15:00+03:00',
          manualStatus: 'Auto',
        },
        mockAttendanceStudentsByGroupId.get('physics-g11-c')![1],
      ]),
    );

    submitBarcode('30001');

    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const scannedRow = rows.find((row) => row.textContent?.includes('Omar Hassan'));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#attendance-barcode-input');

    expect(groupAttendanceDataService.scanBarcode).toHaveBeenCalledWith({ barcodeNumber: '30001', selectedGroupId: null });
    expect(scannedRow?.classList).toContain('student-row-present');
    expect(scannedRow?.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(scannedRow?.textContent).toContain('11:15 PM');
    expect(fixture.nativeElement.textContent).toContain('Omar Hassan present Physics G11-C');
    expect(input.value).toBe('');
  });

  it('syncs an already-present barcode response into a present row', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    groupAttendanceDataService.scanBarcode.mockReturnValue(
      of({
        result: 'ALREADY_PRESENT',
        message: 'Omar Hassan already present',
        student: { id: 'physics-g11-c-1', name: 'Omar Hassan', barcodeNumber: '30001' },
        group: { id: 'physics-g11-c', name: 'Physics G11-C', startTime: '23:00', duration: 60 },
        attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-04T23:15:00+03:00', sessionDate: '2026-06-04' },
      }),
    );
    groupAttendanceDataService.loadStudentsByGroupId.mockReturnValue(
      of([
        {
          ...mockAttendanceStudentsByGroupId.get('physics-g11-c')![0],
          barcode: '30001',
          isPresent: true,
          attendanceState: 'Present',
          attendanceTime: '2026-06-04T23:15:00+03:00',
          manualStatus: 'Auto',
        },
        mockAttendanceStudentsByGroupId.get('physics-g11-c')![1],
      ]),
    );

    submitBarcode('30001');

    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const scannedRow = rows.find((row) => row.textContent?.includes('Omar Hassan'));

    expect(scannedRow?.classList).toContain('student-row-present');
    expect(scannedRow?.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(fixture.nativeElement.textContent).toContain('Omar Hassan already present');
  });

  it('keeps an already-present barcode row present when the immediate refetch is stale', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    groupAttendanceDataService.scanBarcode.mockReturnValue(
      of({
        result: 'ALREADY_PRESENT',
        message: 'Omar Hassan already present',
        student: { id: 'physics-g11-c-1', name: 'Omar Hassan', barcodeNumber: '30001' },
        group: { id: 'physics-g11-c', name: 'Physics G11-C', startTime: '23:00', duration: 60 },
        attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-04T23:15:00+03:00', sessionDate: '2026-06-04' },
      }),
    );
    groupAttendanceDataService.loadStudentsByGroupId.mockReturnValue(
      of([
        { ...mockAttendanceStudentsByGroupId.get('physics-g11-c')![0], barcode: '30001', isPresent: false, attendanceState: 'Absent', manualStatus: 'Manual' },
        mockAttendanceStudentsByGroupId.get('physics-g11-c')![1],
      ]),
    );

    submitBarcode('30001');

    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const scannedRow = rows.find((row) => row.textContent?.includes('Omar Hassan'));

    expect(scannedRow?.classList).toContain('student-row-present');
    expect(scannedRow?.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(fixture.nativeElement.textContent).toContain('Omar Hassan already present');
  });

  it('keeps the student row absent when a barcode scan has no running group', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    groupAttendanceDataService.scanBarcode.mockReturnValue(
      of({
        result: 'NO_RUNNING_GROUP',
        message: "Omar Hassan doesn't have running group yet",
        student: { id: 'physics-g11-c-1', name: 'Omar Hassan', barcodeNumber: '30001' },
        group: null,
        attendance: null,
      }),
    );

    submitBarcode('30001');

    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');

    expect(firstRow.classList).not.toContain('student-row-present');
    expect(firstRow.querySelector('.absent-pill')?.textContent).toContain('Absent');
    expect(fixture.nativeElement.textContent).toContain("Omar Hassan doesn't have running group yet");
  });

  it('shows unknown-barcode feedback without changing table attendance', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    groupAttendanceDataService.scanBarcode.mockReturnValue(
      of({ result: 'BARCODE_NOT_FOUND', message: 'Barcode not found', student: null, group: null, attendance: null }),
    );

    submitBarcode('99999');

    const presentRows = fixture.nativeElement.querySelectorAll('tbody tr.student-row-present');

    expect(presentRows.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Barcode not found');
  });

  it('validates empty barcode input without calling the scan endpoint', () => {
    createComponent();

    submitBarcode('   ');

    expect(groupAttendanceDataService.scanBarcode).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Barcode number is required');
  });

  it('saves absent manual override in the backend before updating the row', () => {
    createComponent();
    clickTimeSlot('11:00 PM');
    const firstPresentButton: HTMLButtonElement = fixture.nativeElement.querySelector('tbody tr .present-button');
    firstPresentButton.click();
    fixture.detectChanges();

    const firstAbsentButton: HTMLButtonElement = fixture.nativeElement.querySelector('tbody tr .absent-button');
    firstAbsentButton.click();
    fixture.detectChanges();

    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');

    expect(groupAttendanceDataService.saveManualAttendance).toHaveBeenLastCalledWith({
      groupId: 'english-g9-a',
      studentId: 'english-g9-a-1',
      attendanceState: 'Absent',
    });
    expect(firstRow.classList).not.toContain('student-row-present');
    expect(firstRow.querySelector('.absent-pill')?.textContent).toContain('Absent');
    expect(firstRow.querySelector('.absent-button-active')).toBeTruthy();
  });

  it('shows the Egypt attendance clock in PM format for a fixed PM value', () => {
    createComponent();

    const clockValue: HTMLElement | null = fixture.nativeElement.querySelector('.attendance-hour-card strong');

    expect(clockValue?.textContent?.trim()).toBe('11:10 PM');
  });

  it('does not render the old simulated hour slot label', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).not.toContain('Simulated Hour Slot');
  });

  it('labels the clock card as a real attendance clock', () => {
    createComponent();

    const clockCard: HTMLElement | null = fixture.nativeElement.querySelector('.attendance-hour-card');

    expect(clockCard?.getAttribute('aria-label')).toBe('Current Egypt attendance clock');
  });

  it('renders duplicate group start times as one schedule slot', () => {
    createComponent();

    const elevenPmButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('11:00 PM'));

    expect(elevenPmButtons.length).toBe(1);
  });

  it('shows the combined group count for duplicate group start times', () => {
    createComponent();

    const elevenPmButton = getTimeSlotButtons().find((button) => button.textContent?.includes('11:00 PM'));

    expect(elevenPmButton?.textContent).toContain('2 Groups');
  });

  it('renders distinct AM and PM group schedule times', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'math-10', groupId: 'math-10', groupName: 'Math 10', startTime: '10:00' }),
      createScheduleSession({ id: 'science-11', groupId: 'science-11', groupName: 'Science 11', startTime: '11:00 AM' }),
      createScheduleSession({ id: 'english-23', groupId: 'english-23', groupName: 'English 23', startTime: '23:00' }),
    ]);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('10:00 AM');
    expect(text).toContain('11:00 AM');
    expect(text).toContain('11:00 PM');
  });

  it('labels the clock-card action as Filter Groups', () => {
    createComponent();

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('.attendance-hour-card button');

    expect(button?.textContent).toContain('Filter Groups');
    expect(button?.textContent).not.toContain('Clear List');
  });

  it('selects the active 11:00 PM schedule slot only after clicking Filter Groups', () => {
    createComponent();

    expect(getActiveTimeSlotButton()).toBeNull();

    clickFilterGroups();

    const activeButton = getActiveTimeSlotButton();

    expect(activeButton?.textContent).toContain('11:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not select an unrelated schedule slot when Filter Groups finds no active window', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'math-10', groupId: 'math-10', groupName: 'Math 10', startTime: '10:00' }),
      createScheduleSession({ id: 'science-11', groupId: 'science-11', groupName: 'Science 11', startTime: '11:00 AM' }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No groups start at this time');
  });

  it('re-evaluates active schedule selection when clicking Filter Groups after the clock changes', () => {
    let currentDate = egyptElevenTenPm;
    createComponent(currentDate, [
      createScheduleSession({ id: 'english-23', groupId: 'english-23', groupName: 'English 23', startTime: '11:00 PM' }),
      createScheduleSession({ id: 'midnight-lesson', groupId: 'midnight-lesson', groupName: 'Midnight Lesson', startTime: '00:00' }),
    ]);

    clickFilterGroups();
    expect(getActiveTimeSlotButton()?.textContent).toContain('11:00 PM');

    currentDate = new Date('2026-06-04T21:05:00.000Z');
    component.nowFactory = () => currentDate;
    component.refreshAttendanceClock();
    fixture.detectChanges();

    expect(getActiveTimeSlotButton()?.textContent).toContain('11:00 PM');

    clickFilterGroups();

    expect(getActiveTimeSlotButton()?.textContent).toContain('12:00 AM');
  });

  it('lets users select a time slot card', () => {
    createComponent();

    clickTimeSlot('2:00 PM');

    const activeButton = getActiveTimeSlotButton();
    const text = fixture.nativeElement.textContent;

    expect(activeButton?.textContent).toContain('2:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
    expect(text).toContain('Scheduled At 2:00 PM');
    expect(text).not.toContain('Simulated Hour Slot');
    expect(text).toContain('2:00 PM');
  });

  it('loads schedule sessions from the tenant schedule data service', () => {
    createComponent();

    expect(scheduleDataService.loadSessions).toHaveBeenCalled();
  });

  it('renders all loaded schedule-session start-time hours from the service', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'math-10', groupId: 'math-10', groupName: 'Math 10', startTime: '10:00' }),
      createScheduleSession({ id: 'science-13', groupId: 'science-13', groupName: 'Science 13', startTime: '13:00' }),
      createScheduleSession({ id: 'english-23', groupId: 'english-23', groupName: 'English 23', startTime: '23:00' }),
    ]);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('10:00 AM');
    expect(text).toContain('1:00 PM');
    expect(text).toContain('11:00 PM');
  });

  it('renders 12-hour minute-based start times with their real minutes', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'math-8-15', groupId: 'math-8-15', groupName: 'Math 8', startTime: '8:15 AM' }),
      createScheduleSession({ id: 'science-11-30', groupId: 'science-11-30', groupName: 'Science 11', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'biology-14-45', groupId: 'biology-14-45', groupName: 'Biology 14', startTime: '2:45 PM' }),
      createScheduleSession({ id: 'english-23-30', groupId: 'english-23-30', groupName: 'English 23', startTime: '11:30 PM' }),
    ]);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('8:15 AM');
    expect(text).toContain('11:30 AM');
    expect(text).toContain('2:45 PM');
    expect(text).toContain('11:30 PM');
  });

  it('renders bare 24-hour 11:30 start times as 11:30 AM', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic', startTime: '11:30' }),
    ]);

    const button = getTimeSlotButtons()[0];

    expect(getTimeSlotButtons().length).toBe(1);
    expect(button.textContent).toContain('11:30 AM');
    expect(button.textContent).toContain('1 Group');
  });

  it('skips invalid start times without hiding valid minute-based slots', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'invalid-label', groupId: 'invalid-label', groupName: 'Invalid Label', startTime: 'later' }),
      createScheduleSession({ id: 'invalid-hour', groupId: 'invalid-hour', groupName: 'Invalid Hour', startTime: '25:10' }),
      createScheduleSession({ id: 'invalid-second', groupId: 'invalid-second', groupName: 'Invalid Second', startTime: '11:30:99 PM' }),
      createScheduleSession({ id: 'valid-8-15', groupId: 'valid-8-15', groupName: 'Valid 8', startTime: '8:15 AM' }),
    ]);

    const text = fixture.nativeElement.textContent;

    expect(getTimeSlotButtons().length).toBe(1);
    expect(text).toContain('8:15 AM');
    expect(text).not.toContain('No group time slots available');
  });

  it('displays different minute starts in the same hour as distinct start-time slots', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-23', groupId: 'english-23', groupName: 'English 23', startTime: '23:00' }),
      createScheduleSession({ id: 'physics-23-30', groupId: 'physics-23-30', groupName: 'Physics 23', startTime: '11:30 PM' }),
      createScheduleSession({ id: 'chemistry-23-45', groupId: 'chemistry-23-45', groupName: 'Chemistry 23', startTime: '11:45 PM' }),
      createScheduleSession({ id: 'history-23-30', groupId: 'history-23-30', groupName: 'History 23', startTime: '23:30' }),
    ]);

    const elevenPmButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('11:00 PM'));
    const elevenThirtyPmButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('11:30 PM'));
    const elevenFortyFivePmButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('11:45 PM'));

    expect(elevenPmButtons.length).toBe(1);
    expect(elevenPmButtons[0].textContent).toContain('1 Group');
    expect(elevenThirtyPmButtons.length).toBe(1);
    expect(elevenThirtyPmButtons[0].textContent).toContain('2 Groups');
    expect(elevenFortyFivePmButtons.length).toBe(1);
    expect(elevenFortyFivePmButtons[0].textContent).toContain('1 Group');
  });

  it('counts one group once when it has repeated sessions at the same normalized start time', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-monday', groupId: 'english-23', groupName: 'English 23', day: 'Monday', startTime: '23:30' }),
      createScheduleSession({ id: 'english-wednesday', groupId: 'english-23', groupName: 'English 23', day: 'Wednesday', startTime: '11:30 PM' }),
    ]);

    const elevenPmButton = getTimeSlotButtons().find((button) => button.textContent?.includes('11:30 PM'));

    expect(elevenPmButton?.textContent).toContain('1 Group');
  });

  it('normalizes 24-hour minute-based start times to AM and PM schedule slots', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'midnight-15', groupId: 'midnight-15', groupName: 'Midnight 15', startTime: '00:15' }),
      createScheduleSession({ id: 'english-23-30', groupId: 'english-23-30', groupName: 'English 23', startTime: '23:30' }),
    ]);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('12:15 AM');
    expect(text).toContain('11:30 PM');
  });

  it('dedupes equivalent 12-hour and 24-hour minute-based start times into one AM/PM slot', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-23-30', groupId: 'english-23-30', groupName: 'English 23', startTime: '23:30' }),
      createScheduleSession({ id: 'physics-11-30-pm', groupId: 'physics-11-30-pm', groupName: 'Physics 23', startTime: '11:30 PM' }),
      createScheduleSession({ id: 'midnight-00-15', groupId: 'midnight-00-15', groupName: 'Midnight 00', startTime: '00:15' }),
      createScheduleSession({ id: 'midnight-12-15-am', groupId: 'midnight-12-15-am', groupName: 'Midnight 12', startTime: '12:15 AM' }),
    ]);

    const elevenPmButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('11:30 PM'));
    const midnightButtons = getTimeSlotButtons().filter((button) => button.textContent?.includes('12:15 AM'));

    expect(elevenPmButtons.length).toBe(1);
    expect(elevenPmButtons[0].textContent).toContain('2 Groups');
    expect(midnightButtons.length).toBe(1);
    expect(midnightButtons[0].textContent).toContain('2 Groups');
  });

  it('sorts normalized minute-based slots chronologically by hour', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-23-30', groupId: 'english-23-30', groupName: 'English 23', startTime: '23:30' }),
      createScheduleSession({ id: 'math-8-15', groupId: 'math-8-15', groupName: 'Math 8', startTime: '8:15 AM' }),
      createScheduleSession({ id: 'midnight-00-15', groupId: 'midnight-00-15', groupName: 'Midnight 00', startTime: '00:15' }),
      createScheduleSession({ id: 'biology-14-45', groupId: 'biology-14-45', groupName: 'Biology 14', startTime: '2:45 PM' }),
    ]);

    const buttonLabels = getTimeSlotButtons().map((button) => button.textContent?.trim() ?? '');

    expect(buttonLabels[0]).toContain('12:15 AM');
    expect(buttonLabels[1]).toContain('8:15 AM');
    expect(buttonLabels[2]).toContain('2:45 PM');
    expect(buttonLabels[3]).toContain('11:30 PM');
  });

  it('shows the no-slots state when loaded sessions contain no parseable start times', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'invalid-time', groupId: 'invalid-time', groupName: 'Invalid Time', startTime: 'later' }),
    ]);

    expect(getTimeSlotButtons().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No group time slots available');
    expect(fixture.nativeElement.textContent).toContain('Scheduled At No matching slot');
  });

  it('selects a loaded matching active schedule after clicking Filter Groups', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-23', groupId: 'english-23', groupName: 'English 23', startTime: '23:00' }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()?.textContent).toContain('11:00 PM');
  });

  it('selects a 4:00 PM group at 4:22 PM when Filter Groups is clicked', () => {
    createComponent(egyptFourTwentyTwoPm, [
      createScheduleSession({ id: 'science-16', groupId: 'science-16', groupName: 'Science 4 PM', startTime: '4:00 PM', duration: 60 }),
      createScheduleSession({ id: 'future-17', groupId: 'future-17', groupName: 'Future 5 PM', startTime: '5:00 PM', duration: 60 }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()?.textContent).toContain('4:00 PM');
    expect(getSelectedGroupText()).toContain('Science 4 PM');
    expect(getSelectedGroupText()).not.toContain('Future 5 PM');
  });

  it('does not select an 11:30 AM group at 11:00 AM', () => {
    createComponent(egyptElevenAm, [
      createScheduleSession({ id: 'eleven-thirty', groupId: 'eleven-thirty', groupName: 'Eleven Thirty Group', startTime: '11:30 AM', duration: 60 }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No groups start at this time');
    expect(getSelectedGroupText()).not.toContain('Eleven Thirty Group');
  });

  it('keeps groups sharing the active start time visible together after Filter Groups', () => {
    createComponent(egyptElevenAm, [
      createScheduleSession({ id: 'english-11', groupId: 'english-11', groupName: 'English 11', startTime: '11:00 AM', duration: 60 }),
      createScheduleSession({ id: 'math-11', groupId: 'math-11', groupName: 'Math 11', startTime: '11:00 AM', duration: 60 }),
      createScheduleSession({ id: 'later-11-30', groupId: 'later-11-30', groupName: 'Later 11:30', startTime: '11:30 AM', duration: 60 }),
    ]);

    clickFilterGroups();

    const groupText = getSelectedGroupText();

    expect(getActiveTimeSlotButton()?.textContent).toContain('11:00 AM');
    expect(getSelectedGroupItems().length).toBe(2);
    expect(groupText).toContain('English 11');
    expect(groupText).toContain('Math 11');
    expect(groupText).not.toContain('Later 11:30');
  });

  it('selects a 4:00 PM group at 4:05 PM but not when its 60 minute duration ends at 5:00 PM', () => {
    const sessions = [
      createScheduleSession({ id: 'science-16', groupId: 'science-16', groupName: 'Science 4 PM', startTime: '4:00 PM', duration: 60 }),
    ];

    createComponent(egyptFourOhFivePm, sessions);
    clickFilterGroups();
    expect(getActiveTimeSlotButton()?.textContent).toContain('4:00 PM');

    component.nowFactory = () => egyptFivePm;
    component.refreshAttendanceClock();
    fixture.detectChanges();
    clickFilterGroups();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No groups start at this time');
  });

  it('ignores missing or invalid durations for Filter Groups while keeping those slots manually selectable', () => {
    createComponent(egyptFourTwentyTwoPm, [
      createScheduleSession({ id: 'missing-duration', groupId: 'missing-duration', groupName: 'Missing Duration', startTime: '4:00 PM', duration: null }),
      createScheduleSession({ id: 'zero-duration', groupId: 'zero-duration', groupName: 'Zero Duration', startTime: '4:30 PM', duration: 0 }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No groups start at this time');

    clickTimeSlot('4:00 PM');

    expect(getActiveTimeSlotButton()?.textContent).toContain('4:00 PM');
    expect(getSelectedGroupText()).toContain('Missing Duration');
    expect(fixture.nativeElement.textContent).not.toContain('No groups start at this time');
  });

  it('chooses the latest active start time when active group windows overlap', () => {
    createComponent(egyptFourTwentyTwoPm, [
      createScheduleSession({ id: 'old-window', groupId: 'old-window', groupName: 'Old Window', startTime: '4:00 PM', duration: 60 }),
      createScheduleSession({ id: 'latest-window', groupId: 'latest-window', groupName: 'Latest Window', startTime: '4:15 PM', duration: 60 }),
    ]);

    clickFilterGroups();

    expect(getActiveTimeSlotButton()?.textContent).toContain('4:15 PM');
    expect(getSelectedGroupText()).toContain('Latest Window');
    expect(getSelectedGroupText()).not.toContain('Old Window');
  });

  it('clears stale filtered selections and lets manual time-slot selection hide the no-active message', () => {
    createComponent(egyptFourOhFivePm, [
      createScheduleSession({ id: 'science-16', groupId: 'science-16', groupName: 'Science 4 PM', startTime: '4:00 PM', duration: 60 }),
      createScheduleSession({ id: 'manual-11', groupId: 'manual-11', groupName: 'Manual 11', startTime: '11:00 AM', duration: 60 }),
    ]);

    clickFilterGroups();
    expect(getSelectedGroupText()).toContain('Science 4 PM');

    component.nowFactory = () => egyptFivePm;
    component.refreshAttendanceClock();
    fixture.detectChanges();
    clickFilterGroups();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No groups start at this time');
    expect(getSelectedGroupText()).not.toContain('Science 4 PM');

    clickTimeSlot('11:00 AM');

    expect(getSelectedGroupText()).toContain('Manual 11');
    expect(fixture.nativeElement.textContent).not.toContain('No groups start at this time');
  });

  it('preserves manual selection across clock refreshes', () => {
    createComponent();
    const onePmButton = getTimeSlotButtons().find((button) => button.textContent?.includes('1:00 PM'));

    onePmButton?.click();
    component.refreshAttendanceClock();
    fixture.detectChanges();

    expect(getActiveTimeSlotButton()?.textContent).toContain('1:00 PM');
  });

  it('shows only groups starting at 11:30 AM after clicking the 11:30 AM time card', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'math-10', groupId: 'math-10', groupName: 'Math 10', startTime: '10:00' }),
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', roomName: 'Room 301', startTime: '11:30' }),
      createScheduleSession({ id: 'science-11-45', groupId: 'science-11-45', groupName: 'Science G8-B', startTime: '11:45' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupText = getSelectedGroupText();

    expect(groupText).toContain('Arabic G8-A');
    expect(groupText).toContain('Room 301');
    expect(groupText).toContain('11:30 AM');
    expect(groupText).not.toContain('Math 10');
    expect(groupText).not.toContain('Science G8-B');
  });

  it('displays selected one-group 11:30 AM metadata and selected-time context', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({
        id: 'arabic-sunday',
        groupId: 'arabic-11-30',
        groupName: 'Arabic G8-A',
        teacherName: 'Hussein',
        roomName: 'Room 102',
        day: 'Sunday',
        startTime: '11:30',
        duration: 60,
      }),
      createScheduleSession({
        id: 'arabic-thursday',
        groupId: 'arabic-11-30',
        groupName: 'Arabic G8-A',
        teacherName: 'Hussein',
        roomName: 'Room 102',
        day: 'Thursday',
        startTime: '11:30 AM',
        duration: 60,
      }),
    ]);

    clickTimeSlot('11:30 AM');

    const text = fixture.nativeElement.textContent;
    const groupText = getSelectedGroupText();

    expect(text).toContain('11:30 AM Groups');
    expect(text).toContain('1 Group');
    expect(text).toContain('Showing scheduled groups related to the selected time slot');
    expect(groupText).toContain('Arabic G8-A');
    expect(groupText).toContain('11:30 AM');
    expect(groupText).toContain('Instructor: Hussein');
    expect(groupText).toContain('Room: Room 102');
    expect(groupText).toContain('Sunday, Thursday · 60 min');
    expect(groupText).toContain('Location: 11:30 AM');
  });

  it('shows a selected group student count and required table headers', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupCard = getSelectedGroupItems()[0];
    const text = groupCard.textContent ?? '';

    expect(text).toContain('2');
    expect(text).toContain('Students');
    expect(text).toContain('Student Name');
    expect(text).toContain('RFID BARCODE ID');
    expect(text).toContain('Attendance State');
    expect(text).toContain('MANUAL OVERRIDE CHECK');
    expect(text).not.toContain('Override Checks');
    expect(text).not.toContain('RFID-11301');
    expect(text).not.toContain('arabic-11-30-1');
  });

  it('loads backend enrolled students for a selected real schedule group with no seeded attendance rows', () => {
    groupAttendanceDataService.loadStudentsByGroupId.mockImplementation((groupId: string | null) =>
      of(
        groupId === 'science-g-1'
          ? [
              createAttendanceStudent('student-10001', 'Ahmed Ali', false, null, '10001'),
              createAttendanceStudent('student-10002', 'Sara Mohamed', false, null, '10002'),
            ]
          : [],
      ),
    );
    createComponent(egyptElevenTenPm, [
      createScheduleSession({
        id: 'science-g-1:monday:10:00',
        groupId: 'science-g-1',
        groupName: 'SCINCE G-1',
        teacherName: 'Mohamed Hussein',
        roomName: 'Room 102',
        startTime: '10:00 AM',
      }),
    ]);

    clickTimeSlot('10:00 AM');
    fixture.detectChanges();

    const groupCard = getSelectedGroupItems()[0];
    const text = groupCard.textContent ?? '';

    expect(groupAttendanceDataService.loadStudentsByGroupId).toHaveBeenCalledWith('science-g-1');
    expect(text).toContain('SCINCE G-1');
    expect(text).toContain('2 Students');
    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('Sara Mohamed');
    expect(text).toContain('10001');
    expect(text).not.toContain('No students are assigned to this selected group.');
  });

  it('scopes student rows to the selected group card', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const [algebraCard, arabicCard] = getSelectedGroupItems();
    const algebraText = algebraCard.textContent ?? '';
    const arabicText = arabicCard.textContent ?? '';

    expect(algebraText).toContain('Algebra G8-B');
    expect(algebraText).toContain('Nour Khaled');
    expect(algebraText).not.toContain('Hussein Adel');
    expect(arabicText).toContain('Arabic G8-A');
    expect(arabicText).toContain('Hussein Adel');
    expect(arabicText).toContain('Mariam Samir');
    expect(arabicText).not.toContain('Nour Khaled');
  });

  it('shows a group-level zero-students state for selected groups with no students', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'empty-11-30', groupId: 'empty-11-30', groupName: 'Empty 11:30', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const text = getSelectedGroupText();

    expect(text).toContain('Empty 11:30');
    expect(text).toContain('Present Status');
    expect(text).toContain('0 / 0 Present');
    expect(text).toContain('0%');
    expect(text).toContain('0 Students');
    expect(text).toContain('No students are assigned to this selected group.');
    expect(fixture.nativeElement.querySelector('tbody tr')).toBeNull();
  });

  it('keeps two different groups with the selected 11:30 AM start time visible', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'history-12', groupId: 'history-12', groupName: 'History G8-C', startTime: '12:00 PM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupText = getSelectedGroupText();

    expect(getSelectedGroupItems().length).toBe(2);
    expect(groupText).toContain('Arabic G8-A');
    expect(groupText).toContain('Algebra G8-B');
    expect(groupText).not.toContain('History G8-C');
  });

  it('renders same-time groups as separate cards with independent table rows', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', roomName: 'Room 102', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', roomName: 'Room 104', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'science-11-45', groupId: 'science-11-45', groupName: 'Science G8-C', startTime: '11:45 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupCards = getSelectedGroupItems();

    expect(groupCards.length).toBe(2);
    expect(groupCards[0].textContent).toContain('Algebra G8-B');
    expect(groupCards[0].textContent).toContain('Room 104');
    expect(groupCards[0].querySelectorAll('tbody tr').length).toBe(1);
    expect(groupCards[1].textContent).toContain('Arabic G8-A');
    expect(groupCards[1].textContent).toContain('Room 102');
    expect(groupCards[1].querySelectorAll('tbody tr').length).toBe(2);
    expect(getSelectedGroupText()).not.toContain('Science G8-C');
  });

  it('renders selected time groups as standalone cards without a visual parent card wrapper', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const selectedGroupsSection = getSelectedGroupsSection();

    expect(selectedGroupsSection).toBeTruthy();
    expect(selectedGroupsSection?.classList.contains('attendance-table-card')).toBe(false);
    expect(selectedGroupsSection?.querySelector('.attendance-table-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.attendance-table-card')).toBeNull();
    expect(getSelectedGroupItems().length).toBe(2);
  });

  it('shows per-card present status counts for each selected group', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const [algebraCard, arabicCard] = getSelectedGroupItems();

    expect(algebraCard.textContent).toContain('Present Status');
    expect(algebraCard.textContent).toContain('0 / 1 Present');
    expect(algebraCard.textContent).toContain('0%');
    expect(arabicCard.textContent).toContain('Present Status');
    expect(arabicCard.textContent).toContain('0 / 2 Present');
    expect(arabicCard.textContent).toContain('0%');
  });

  it('updates only the owning group card when a student is marked present manually', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic G8-A', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'algebra-11-30', groupId: 'algebra-11-30', groupName: 'Algebra G8-B', startTime: '11:30 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const [algebraCardBefore, arabicCardBefore] = getSelectedGroupItems();
    const algebraPresentButton: HTMLButtonElement | null = algebraCardBefore.querySelector('.present-button');

    expect(algebraCardBefore.textContent).toContain('0 / 1 Present');
    expect(arabicCardBefore.textContent).toContain('0 / 2 Present');

    algebraPresentButton?.click();
    fixture.detectChanges();

    const [algebraCardAfter, arabicCardAfter] = getSelectedGroupItems();

    expect(algebraCardAfter.textContent).toContain('1 / 1 Present');
    expect(algebraCardAfter.textContent).toContain('100%');
    expect(algebraCardAfter.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(arabicCardAfter.textContent).toContain('0 / 2 Present');
    expect(arabicCardAfter.querySelector('.present-pill')).toBeNull();
  });

  it('excludes groups at other start times after a time card click', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-11', groupId: 'english-11', groupName: 'English 11', startTime: '11:00 AM' }),
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic 11:30', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'physics-11-45', groupId: 'physics-11-45', groupName: 'Physics 11:45', startTime: '11:45 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupText = getSelectedGroupText();

    expect(groupText).toContain('Arabic 11:30');
    expect(groupText).not.toContain('English 11');
    expect(groupText).not.toContain('Physics 11:45');
  });

  it('marks the clicked time card active with aria-pressed selected state', () => {
    createComponent();

    clickTimeSlot('2:00 PM');

    const activeButton = getActiveTimeSlotButton();

    expect(activeButton?.textContent).toContain('2:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('updates the selected group list when clicking a second time card', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'arabic-11-30', groupId: 'arabic-11-30', groupName: 'Arabic 11:30', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'biology-14', groupId: 'biology-14', groupName: 'Biology 2', startTime: '2:00 PM' }),
    ]);

    clickTimeSlot('11:30 AM');
    expect(getSelectedGroupText()).toContain('Arabic 11:30');

    clickTimeSlot('2:00 PM');

    const groupText = getSelectedGroupText();

    expect(groupText).toContain('Biology 2');
    expect(groupText).not.toContain('Arabic 11:30');
  });

  it('does not mutate schedule or clock state when selecting a time slot', () => {
    createComponent();
    const clockBefore = component.attendanceClock;
    const sessionsBefore = component.scheduleSessions;

    clickTimeSlot('2:00 PM');

    expect(component.attendanceClock).toBe(clockBefore);
    expect(component.scheduleSessions).toBe(sessionsBefore);
  });

  it('selecting 11:30 AM excludes groups at 11:00 AM and 11:45 AM', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'eleven', groupId: 'eleven', groupName: 'Eleven AM Group', startTime: '11:00 AM' }),
      createScheduleSession({ id: 'eleven-thirty', groupId: 'eleven-thirty', groupName: 'Eleven Thirty Group', startTime: '11:30 AM' }),
      createScheduleSession({ id: 'eleven-forty-five', groupId: 'eleven-forty-five', groupName: 'Eleven Forty Five Group', startTime: '11:45 AM' }),
    ]);

    clickTimeSlot('11:30 AM');

    const groupText = getSelectedGroupText();

    expect(groupText).toContain('Eleven Thirty Group');
    expect(groupText).not.toContain('Eleven AM Group');
    expect(groupText).not.toContain('Eleven Forty Five Group');
  });

  it('shows equivalent raw times such as 23:30 and 11:30 PM under the same clicked card', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-23-30', groupId: 'english-23-30', groupName: 'English 23:30', startTime: '23:30' }),
      createScheduleSession({ id: 'physics-11-30-pm', groupId: 'physics-11-30-pm', groupName: 'Physics PM', startTime: '11:30 PM' }),
      createScheduleSession({ id: 'chemistry-23-45', groupId: 'chemistry-23-45', groupName: 'Chemistry 23:45', startTime: '23:45' }),
    ]);

    clickTimeSlot('11:30 PM');

    const groupText = getSelectedGroupText();

    expect(getSelectedGroupItems().length).toBe(2);
    expect(groupText).toContain('English 23:30');
    expect(groupText).toContain('Physics PM');
    expect(groupText).not.toContain('Chemistry 23:45');
  });

  it('shows a repeated group across multiple days once for the selected start time', () => {
    createComponent(egyptElevenTenPm, [
      createScheduleSession({ id: 'english-monday', groupId: 'english-23-30', groupName: 'English 23:30', day: 'Monday', startTime: '23:30' }),
      createScheduleSession({ id: 'english-wednesday', groupId: 'english-23-30', groupName: 'English 23:30', day: 'Wednesday', startTime: '11:30 PM' }),
    ]);

    clickTimeSlot('11:30 PM');

    const groupText = getSelectedGroupText();

    expect(getSelectedGroupItems().length).toBe(1);
    expect(groupText).toContain('English 23:30');
    expect(groupText).toContain('Monday, Wednesday');
  });
});
