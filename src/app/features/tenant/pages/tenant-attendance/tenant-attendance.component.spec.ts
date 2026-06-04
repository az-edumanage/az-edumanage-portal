import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantAttendanceComponent } from './tenant-attendance.component';

describe('TenantAttendanceComponent', () => {
  let fixture: ComponentFixture<TenantAttendanceComponent>;
  let component: TenantAttendanceComponent;

  const egyptElevenTenPm = new Date('2026-06-04T20:10:00.000Z');

  const createComponent = (now: Date = egyptElevenTenPm): void => {
    fixture = TestBed.createComponent(TenantAttendanceComponent);
    component = fixture.componentInstance;
    component.nowFactory = () => now;
    fixture.detectChanges();
  };

  const getTimeSlotButtons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.time-slot-grid button')) as HTMLButtonElement[];

  const getActiveTimeSlotButton = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.time-slot-active');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantAttendanceComponent],
      providers: [provideRouter([])],
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
    const text = fixture.nativeElement.textContent;
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(text).toContain('Study Group Attendance Control Chamber');
    expect(text).toContain('Student Barcode Reader');
    expect(text).toContain('Currently Academic Classes');
    expect(text).toContain('Live Attendance Rate Progress Tracker');
    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Manual Override Checks');
    expect(text).toContain('Ahmed Ali');
    expect(rows.length).toBe(5);
  });

  it('updates student attendance buttons, row state, and progress after marking present', () => {
    createComponent();
    const firstPresentButton: HTMLButtonElement = fixture.nativeElement.querySelector('tbody tr .present-button');

    firstPresentButton.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const firstRow: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');
    const progressFill: HTMLElement = fixture.nativeElement.querySelector('.attendance-progress-track span');

    expect(firstRow.classList).toContain('student-row-present');
    expect(firstRow.querySelector('.present-pill')?.textContent).toContain('Present');
    expect(firstRow.querySelector('.present-button-active')).toBeTruthy();
    expect(firstRow.querySelector('.absent-button-active')).toBeFalsy();
    expect(text).toContain('1 / 9');
    expect(text).toContain('1 / 5 Present');
    expect(text).toContain('11%');
    expect(progressFill.style.width).toBe('11%');
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
    fixture = TestBed.createComponent(TenantAttendanceComponent);
    component = fixture.componentInstance;
    component.nowFactory = () => egyptElevenTenPm;
    component.attendanceGroupScheduleEntries = [
      { id: 'math-10', name: 'Math 10', startTime: '10:00 AM' },
      { id: 'science-11', name: 'Science 11', startTime: '11:00 AM' },
      { id: 'english-23', name: 'English 23', startTime: '11:00 PM' },
    ];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('10:00 AM');
    expect(text).toContain('11:00 AM');
    expect(text).toContain('11:00 PM');
  });

  it('automatically selects the schedule slot matching the current Egypt-time hour', () => {
    createComponent();

    const activeButton = getActiveTimeSlotButton();

    expect(activeButton?.textContent).toContain('11:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not select an unrelated schedule slot when the current hour has no match', () => {
    fixture = TestBed.createComponent(TenantAttendanceComponent);
    component = fixture.componentInstance;
    component.nowFactory = () => egyptElevenTenPm;
    component.attendanceGroupScheduleEntries = [
      { id: 'math-10', name: 'Math 10', startTime: '10:00 AM' },
      { id: 'science-11', name: 'Science 11', startTime: '11:00 AM' },
    ];
    fixture.detectChanges();

    expect(getActiveTimeSlotButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Scheduled At No matching slot');
  });

  it('re-evaluates automatic schedule selection when the clock hour changes', () => {
    let currentDate = egyptElevenTenPm;
    fixture = TestBed.createComponent(TenantAttendanceComponent);
    component = fixture.componentInstance;
    component.nowFactory = () => currentDate;
    component.attendanceGroupScheduleEntries = [
      { id: 'english-23', name: 'English 23', startTime: '11:00 PM' },
      { id: 'midnight-lesson', name: 'Midnight Lesson', startTime: '12:00 AM' },
    ];
    fixture.detectChanges();

    expect(getActiveTimeSlotButton()?.textContent).toContain('11:00 PM');

    currentDate = new Date('2026-06-04T21:05:00.000Z');
    component.refreshAttendanceClock();
    fixture.detectChanges();

    expect(getActiveTimeSlotButton()?.textContent).toContain('12:00 AM');
  });

  it('lets users select a time slot card', () => {
    createComponent();
    const timeButtons = getTimeSlotButtons();
    const twoPmButton = timeButtons.find((button) => button.textContent?.includes('02:00 PM'));

    twoPmButton?.click();
    fixture.detectChanges();

    const activeButton = getActiveTimeSlotButton();
    const text = fixture.nativeElement.textContent;

    expect(activeButton?.textContent).toContain('02:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
    expect(text).toContain('Scheduled At 02:00 PM');
    expect(text).not.toContain('Simulated Hour Slot');
    expect(text).toContain('02:00 PM');
  });
});
