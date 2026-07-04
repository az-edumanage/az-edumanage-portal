import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { StudentDetails } from '../../models/tenant-students.models';
import { TenantStudentDetailsComponent } from './tenant-student-details.component';

describe('TenantStudentDetailsComponent', () => {
  let fixture: ComponentFixture<TenantStudentDetailsComponent>;
  let dataService: { getStudent: ReturnType<typeof vi.fn> };

  const student: StudentDetails = {
    id: 'student-1',
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    grade: 'Basic Education',
    status: 'Active',
    enrollmentDate: 'Jun 2026',
    phone: '+201000000000',
    barcodeNumber: '000000000123',
    gender: 'Male',
    birthDate: 'Jan 10, 2008',
    parentName: 'Parent Ali',
    parentPhone: '+201000000001',
    address: 'Cairo',
    notifyParent: true,
    educationCategory: 'Basic Education',
    scheduleSummary: {
      attendanceLabel: '0%',
      attendanceProgress: 0,
      scheduleDaysCount: 2,
      totalGroups: 1,
      groupsCount: 1,
    },
    scheduleRows: [
      {
        groupId: 'group-1',
        group: 'Physics G12-A',
        day: 'Monday',
        time: '10:00 AM (90 min)',
        roomId: 'room-1',
        room: 'Room 101',
        teacherId: 'teacher-1',
        teacher: 'Dr. Ahmed',
      },
      {
        groupId: 'group-2',
        group: 'Chemistry Lab',
        day: 'Tuesday',
        time: '11:00 AM (60 min)',
        roomId: 'room-2',
        room: 'Room 102',
        teacherId: 'teacher-2',
        teacher: 'Ms. Sara',
      },
      {
        groupId: 'group-3',
        group: 'Math Practice',
        day: 'Wednesday',
        time: '12:00 PM (60 min)',
        roomId: 'room-3',
        room: 'Room 103',
        teacherId: 'teacher-3',
        teacher: 'Mr. Omar',
      },
      {
        groupId: 'group-4',
        group: 'Arabic Reading',
        day: 'Thursday',
        time: '01:00 PM (60 min)',
        roomId: 'room-4',
        room: 'Room 104',
        teacherId: 'teacher-4',
        teacher: 'Ms. Hala',
      },
      {
        groupId: 'group-5',
        group: 'English Grammar',
        day: 'Friday',
        time: '02:00 PM (60 min)',
        roomId: 'room-5',
        room: 'Room 105',
        teacherId: 'teacher-5',
        teacher: 'Mr. John',
      },
      {
        groupId: 'group-6',
        group: 'Biology Revision',
        day: 'Saturday',
        time: '03:00 PM (60 min)',
        roomId: 'room-6',
        room: 'Room 106',
        teacherId: 'teacher-6',
        teacher: 'Dr. Mona',
      },
    ],
  };

  async function createComponent(currentStudent: StudentDetails): Promise<void> {
    dataService = {
      getStudent: vi.fn().mockReturnValue(of(currentStudent)),
    };

    await TestBed.configureTestingModule({
      imports: [TenantStudentDetailsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('student-1'),
              },
            },
          },
        },
        { provide: TenantStudentsDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantStudentDetailsComponent);
    fixture.detectChanges();
  }

  function scheduleTableText(): string {
    return (fixture.nativeElement.querySelector('.student-schedule-table') as HTMLElement).textContent ?? '';
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads and renders the human-readable student barcode value', async () => {
    await createComponent(student);

    expect(dataService.getStudent).toHaveBeenCalledWith('student-1');
    expect(fixture.nativeElement.textContent).toContain('000000000123');
  });

  it('renders a barcode SVG for the stored student barcode value', async () => {
    await createComponent(student);

    const barcodeSvg = fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"] svg');

    expect(barcodeSvg).not.toBeNull();
    expect(barcodeSvg?.getAttribute('data-student-barcode-value')).toBe('000000000123');
  });

  it('uses the same value for the barcode SVG and student barcode number', async () => {
    await createComponent(student);

    const barcodeSvg = fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"] svg');

    expect(barcodeSvg?.getAttribute('data-student-barcode-value')).toBe(student.barcodeNumber);
  });

  it('does not render a barcode SVG when the student has no barcode number', async () => {
    await createComponent({ ...student, barcodeNumber: '' });

    expect(fixture.nativeElement.textContent).toContain('Not set');
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"] svg')).toBeNull();
  });

  it('does not render a barcode SVG when the student barcode value is invalid', async () => {
    await createComponent({ ...student, barcodeNumber: 'invalid-value' });

    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"] svg')).toBeNull();
  });

  it('renders Print Barcode in Quick Actions', async () => {
    await createComponent(student);

    expect(fixture.nativeElement.textContent).toContain('Print Barcode');
  });

  it('links Print Barcode to the current student barcode print page', async () => {
    await createComponent(student);

    const printLink = fixture.nativeElement.querySelector('a[href="/tenant/students/student-1/barcode/print"]');

    expect(printLink).not.toBeNull();
    expect(printLink?.textContent).toContain('Print Barcode');
  });

  it('keeps existing profile, academic details, parent details, barcode, and quick actions visible', async () => {
    await createComponent(student);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('ahmed@example.com');
    expect(text).toContain('+201000000000');
    expect(text).toContain('000000000123');
    expect(text).toContain('Male');
    expect(text).toContain('Jan 10, 2008');
    expect(text).toContain('Academic Details');
    expect(text).toContain('Education');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Enrolled');
    expect(text).toContain('Jun 2026');
    expect(text).toContain('Parent Details');
    expect(text).toContain('Parent Ali');
    expect(text).toContain('+201000000001');
    expect(text).toContain('Cairo');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('Attendance');
    expect(text).toContain('Billing');
    expect(text).toContain('Print Barcode');
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"] svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/tenant/students/student-1/barcode/print"]')).not.toBeNull();
  });

  it('renders student schedule summary cards with the requested labels', async () => {
    await createComponent(student);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Attendance');
    expect(text).toContain('Schedule days');
    expect(text).toContain('total groups');
    expect(text).toContain('Groups');
    expect(fixture.nativeElement.querySelector('.ds-progress-fill')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ds-progress-fill')?.getAttribute('style')).toContain('--ds-progress: 0%');
  });

  it('renders student schedule table headers in order', async () => {
    await createComponent(student);

    const headers = Array.from(fixture.nativeElement.querySelectorAll('th'))
      .map((header) => (header as HTMLElement).textContent?.trim())
      .filter(Boolean);

    expect(headers).toEqual(['Group', 'Day', 'Time', 'Room', 'Teacher']);
  });

  it('renders student schedule row values', async () => {
    await createComponent(student);

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Monday');
    expect(text).toContain('10:00 AM (90 min)');
    expect(text).toContain('Room 101');
    expect(text).toContain('Dr. Ahmed');
  });

  it('paginates weekly schedule rows', async () => {
    await createComponent(student);

    expect(fixture.nativeElement.textContent).toContain('1-5 of 6');
    expect(fixture.nativeElement.textContent).toContain('English Grammar');
    expect(fixture.nativeElement.textContent).not.toContain('Biology Revision');

    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Next schedule page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('6-6 of 6');
    expect(scheduleTableText()).toContain('Biology Revision');
    expect(scheduleTableText()).not.toContain('Physics G12-A');
  });

  it('filters weekly schedule rows by search query and resets pagination', async () => {
    await createComponent(student);

    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Next schedule page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'biology';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.schedulePageIndex()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('1-1 of 1');
    expect(scheduleTableText()).toContain('Biology Revision');
    expect(scheduleTableText()).not.toContain('Physics G12-A');
  });

  it('renders a searched schedule empty state when no rows match', async () => {
    await createComponent(student);

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'not-a-real-group';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No schedule rows match your search');
    expect(fixture.nativeElement.textContent).toContain('0-0 of 0');
  });

  it('renders a schedule empty state when the student has no schedule rows', async () => {
    await createComponent({ ...student, scheduleRows: [] });

    expect(fixture.nativeElement.textContent).toContain('No schedule rows');
  });
});
