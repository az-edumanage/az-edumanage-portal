import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantAttendanceComponent } from './tenant-attendance.component';

describe('TenantAttendanceComponent', () => {
  let fixture: ComponentFixture<TenantAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantAttendanceComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantAttendanceComponent);
    fixture.detectChanges();
  });

  it('renders the attendance sub navigation under the tenant top bar area', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Academic Attendance');
    expect(text).toContain('TENANT_G2');
    expect(text).toContain('Record Attendance');
    expect(text).toContain('Groups Block');
    expect(text).toContain('Student Roster');
  });

  it('keeps the record attendance tab active', () => {
    const activeTab: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.tenant-attendance-tab-active');

    expect(activeTab?.getAttribute('href')).toBe('/tenant/attendance');
    expect(activeTab?.getAttribute('aria-current')).toBe('page');
  });

  it('renders the attendance scanner, summary cards, and student table in English', () => {
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

  it('lets users select a time slot card', () => {
    const timeButtons = Array.from(fixture.nativeElement.querySelectorAll('.time-slot-grid button')) as HTMLButtonElement[];
    const twoPmButton = timeButtons.find((button) => button.textContent?.includes('02:00 PM'));

    twoPmButton?.click();
    fixture.detectChanges();

    const activeButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('.time-slot-active');
    const text = fixture.nativeElement.textContent;

    expect(activeButton?.textContent).toContain('02:00 PM');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
    expect(text).toContain('Scheduled At 02:00 PM');
    expect(text).toContain('Simulated Hour Slot');
    expect(text).toContain('02:00 PM');
  });
});
