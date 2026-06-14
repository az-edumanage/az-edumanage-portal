import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import { TenantAttendanceStudent } from '../../models/tenant-group-attendance.models';
import { TenantGroupAttendanceFacade } from '../../state/tenant-group-attendance.facade';
import { TenantGroupAttendanceComponent } from './tenant-group-attendance.component';

describe('TenantGroupAttendanceComponent', () => {
  let fixture: ComponentFixture<TenantGroupAttendanceComponent>;
  const students = signal<TenantAttendanceStudent[]>([
    createStudent('student-1', 'Ahmed Ali', '10001', true),
    createStudent('student-2', 'Sara Mohamed', '10002', false),
    createStudent('student-3', 'Omar Hassan', '10003', false),
    createStudent('student-4', 'Laila Mahmoud', '10004', false),
    createStudent('student-5', 'Nour Khaled', '10005', true),
    createStudent('student-6', 'Mariam Samir', '10006', false),
  ]);
  const presentCount = computed(() => students().filter((student) => student.isPresent).length);
  const attendanceAvailable = signal(true);
  const facade = {
    groupId: signal('group-123'),
    today: new Date('2026-06-11T10:00:00+03:00'),
    students,
    isLoading: signal(false),
    error: signal<string | null>(null),
    attendanceAvailable,
    attendanceBlockedMessage: computed(() =>
      attendanceAvailable() ? null : 'Attendance actions will be available when the current group session starts.',
    ),
    presentCount,
    absentCount: computed(() => students().filter((student) => !student.isPresent).length),
    attendanceRate: computed(() => Math.round((presentCount() / students().length) * 100)),
    loadGroup: vi.fn().mockResolvedValue(undefined),
    toggleAttendance: vi.fn((id: string, isPresent: boolean) => {
      students.update((list) => list.map((student) => student.id === id ? { ...student, isPresent } : student));
    }),
    markAll: vi.fn(),
    saveAttendance: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    students.set([
      createStudent('student-1', 'Ahmed Ali', '10001', true),
      createStudent('student-2', 'Sara Mohamed', '10002', false),
      createStudent('student-3', 'Omar Hassan', '10003', false),
      createStudent('student-4', 'Laila Mahmoud', '10004', false),
      createStudent('student-5', 'Nour Khaled', '10005', true),
      createStudent('student-6', 'Mariam Samir', '10006', false),
    ]);
    attendanceAvailable.set(true);
    facade.loadGroup.mockClear();
    facade.toggleAttendance.mockClear();
    facade.markAll.mockClear();

    await TestBed.configureTestingModule({
      imports: [TenantGroupAttendanceComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123' }),
            },
          },
        },
        { provide: TenantGroupAttendanceFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupAttendanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders attendance students in a searchable table with barcode column', () => {
    const headers = Array.from(fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>)
      .map((header) => header.textContent?.trim());

    expect(facade.loadGroup).toHaveBeenCalledWith('group-123');
    expect(headers).toEqual(['Student', 'Barcode', 'Overall Attendance', 'Status', 'Actions']);
    expect(fixture.nativeElement.textContent).toContain('Ahmed Ali');
    expect(fixture.nativeElement.textContent).toContain('10001');
    expect(fixture.nativeElement.textContent).toContain('Showing 1-5 of 6 students');
  });

  it('searches and filters the attendance table', () => {
    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    searchInput.value = 'sara';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sara Mohamed');
    expect(fixture.nativeElement.textContent).not.toContain('Ahmed Ali');

    fixture.componentInstance.setStudentSearchTerm('');
    fixture.detectChanges();
    const filterSelect = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    filterSelect.value = 'present';
    filterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ahmed Ali');
    expect(fixture.nativeElement.textContent).not.toContain('Sara Mohamed');
  });

  it('paginates the student attendance table', () => {
    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Next students page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 6-6 of 6 students');
    expect(fixture.nativeElement.textContent).toContain('Mariam Samir');
    expect(fixture.nativeElement.textContent).not.toContain('Ahmed Ali');
  });

  it('marks a matching barcode student present from the quick input', () => {
    const barcodeInput = Array.from(fixture.nativeElement.querySelectorAll('input'))
      .find((input) => (input as HTMLInputElement).placeholder === 'Student barcode quick present') as HTMLInputElement;
    barcodeInput.value = '10002';
    barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(facade.toggleAttendance).toHaveBeenCalledWith('student-2', true);
    expect(fixture.nativeElement.textContent).toContain('Sara Mohamed marked present.');
  });

  it('disables attendance actions before the current group starts', () => {
    attendanceAvailable.set(false);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('form button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    fixture.componentInstance.markBarcodePresent();
    fixture.componentInstance.toggleAttendance('student-2', true);
    fixture.componentInstance.markAll(true);
    fixture.detectChanges();

    expect(facade.toggleAttendance).not.toHaveBeenCalled();
    expect(facade.markAll).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Attendance actions will be available when the current group session starts.');
  });
});

function createStudent(id: string, name: string, barcode: string, isPresent: boolean): TenantAttendanceStudent {
  return {
    id,
    name,
    rfid: null,
    barcode,
    isPresent,
    attendanceState: isPresent ? 'Present' : 'Absent',
    attendanceTime: '',
    manualStatus: 'Manual',
    overrideChecks: 'Ready',
    attendanceRate: isPresent ? 90 : 70,
    totalSessions: 10,
    attendedSessions: isPresent ? 9 : 7,
  };
}
