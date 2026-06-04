import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { GroupDetails, GroupStudent } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';
import { TenantGroupDetailsComponent } from './tenant-group-details.component';

describe('TenantGroupDetailsComponent', () => {
  let fixture: ComponentFixture<TenantGroupDetailsComponent>;
  const initialGroup: GroupDetails = {
    id: 'group-123',
    name: 'Physics G12-A',
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
  const facade = {
    group,
    selectedStudent,
    students,
    isLoading: signal(false),
    error: signal<string | null>(null),
    avgAttendanceLabel: signal('0%'),
    absenceRateLabel: signal('0%'),
    monthlyRevenueLabel: signal('1500 EGP'),
    capacityUsageLabel: signal('12%'),
    loadGroup: vi.fn(),
    selectStudent: vi.fn((student: GroupStudent) => selectedStudent.set(student)),
    clearSelectedStudent: vi.fn(() => selectedStudent.set(null)),
  };

  beforeEach(async () => {
    facade.loadGroup.mockClear();
    facade.selectStudent.mockClear();
    facade.clearSelectedStudent.mockClear();
    group.set(initialGroup);
    students.set(initialStudents);
    selectedStudent.set(null);
    facade.isLoading.set(false);
    facade.error.set(null);
    await TestBed.configureTestingModule({
      imports: [TenantGroupDetailsComponent],
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
        { provide: TenantGroupDetailsFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupDetailsComponent);
    fixture.detectChanges();
  });

  it('renders the existing metric card labels', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Total Students');
    expect(text).toContain('Avg. Attendance');
    expect(text).toContain('Absence Rate');
    expect(text).toContain('Monthly Revenue');
  });

  it('keeps the existing enrolled students table columns', () => {
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th'),
      (header) => (header as HTMLElement).textContent?.trim(),
    );

    expect(headers).toEqual(['Student', 'Attendance', 'Last Seen', 'Actions']);
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
    expect(text).toContain('Report');
  });

  it('renders backend-loaded enrolled students in the existing table rows', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('ahmed@example.com');
    expect(text).toContain('Sara Mohamed');
    expect(text).toContain('sara@example.com');
    expect(text).not.toContain('Omar Hassan');
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
