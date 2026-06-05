import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TenantGroupDetailsDataService } from './tenant-group-details-data.service';

describe('TenantGroupDetailsDataService', () => {
  let service: TenantGroupDetailsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantGroupDetailsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('maps selected group summary fields from the backend detail endpoint', () => {
    const actual = service.loadGroupById('group-123').subscribe((group) => {
      expect(group.id).toBe('group-123');
      expect(group.enrolled).toBe(3);
      expect(group.capacity).toBe(25);
      expect(group.fees).toBe(500);
      expect(group.pricePerStudent).toBe(500);
      expect(group.avgAttendanceRate).toBeNull();
      expect(group.absenceRate).toBeNull();
      expect(group.attendanceAvailable).toBe(false);
      expect(group.monthlyRevenue).toBe(1500);
      expect(group.currency).toBe('EGP');
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-123',
      name: 'Physics G12-A',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      room: 'Lab 101',
      schedule: 'Monday 10:00',
      capacity: 25,
      enrolled: 3,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 1500,
      currency: 'EGP',
      students: [],
    });

    actual.unsubscribe();
  });

  it('maps enrolled-student rows from the backend detail endpoint', () => {
    const actual = service.loadGroupById('group-123').subscribe((group) => {
      expect(group.students).toEqual([
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          barcodeNumber: null,
          attendanceRate: 0,
          lastAttendance: '',
        },
        {
          id: 'student-2',
          name: 'Sara Mohamed',
          email: 'sara@example.com',
          barcodeNumber: null,
          attendanceRate: 87,
          lastAttendance: '2026-05-31',
        },
      ]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-123',
      name: 'Physics G12-A',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      room: 'Lab 101',
      schedule: 'Monday 10:00',
      capacity: 25,
      enrolled: 2,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 1000,
      currency: 'EGP',
      students: [
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          barcodeNumber: null,
          attendanceRate: null,
          lastAttendance: '',
        },
        {
          id: 'student-2',
          name: 'Sara Mohamed',
          email: 'sara@example.com',
          barcodeNumber: null,
          attendanceRate: 87,
          lastAttendance: '2026-05-31',
        },
      ],
    });

    actual.unsubscribe();
  });

  it('maps newly enrolled student rows from the refreshed backend detail response', () => {
    const actual = service.loadGroupById('e9e4dd77-4126-4b2b-8e32-19f842e9ecd8').subscribe((group) => {
      expect(group.enrolled).toBe(2);
      expect(group.students?.map((student) => student.name)).toEqual(['Ahmed Ali', 'Mona Hassan']);
      expect(group.students?.map((student) => student.email)).toEqual(['ahmed@example.com', 'mona@example.com']);
    });

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/tenant/groups/e9e4dd77-4126-4b2b-8e32-19f842e9ecd8`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'e9e4dd77-4126-4b2b-8e32-19f842e9ecd8',
      name: 'Basic Education Grade X',
      subject: 'Mathematics',
      teacher: 'Sarah Nabil',
      room: 'Room 10',
      schedule: 'Monday 10:00',
      capacity: 30,
      enrolled: 2,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 1000,
      currency: 'EGP',
      students: [
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          barcodeNumber: null,
          attendanceRate: null,
          lastAttendance: '',
        },
        {
          id: 'student-2',
          name: 'Mona Hassan',
          email: 'mona@example.com',
          attendanceRate: null,
          lastAttendance: '',
        },
      ],
    });

    actual.unsubscribe();
  });

  it('maps a missing students field as an empty enrolled-student array', () => {
    const actual = service.loadGroupById('group-without-students').subscribe((group) => {
      expect(group.students).toEqual([]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-without-students`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-without-students',
      name: 'Physics G12-B',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      room: 'Lab 101',
      schedule: 'Monday 10:00',
      capacity: 25,
      enrolled: 0,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 0,
      currency: 'EGP',
    });

    actual.unsubscribe();
  });

  it('maps an empty enrolled-student array without seeded rows', () => {
    const actual = service.loadGroupById('group-empty').subscribe((group) => {
      expect(group.enrolled).toBe(0);
      expect(group.students).toEqual([]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-empty`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-empty',
      name: 'Physics G12-B',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      room: 'Lab 101',
      schedule: 'Monday 10:00',
      capacity: 25,
      enrolled: 0,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 0,
      currency: 'EGP',
      students: [],
    });

    actual.unsubscribe();
  });

  it('uses the backend error message when selected group detail loading fails', () => {
    const actual = service.loadGroupById('missing-group').subscribe({
      next: () => {
        throw new Error('Expected group detail loading to fail');
      },
      error: (error: Error) => {
        expect(error.message).toBe('Group not found');
      },
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/missing-group`);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Group not found' }, { status: 404, statusText: 'Not Found' });

    actual.unsubscribe();
  });

  it('sends remove student from group requests', () => {
    const actual = service.removeStudentFromGroup('group-123', 'student-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/enrollments/student-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    actual.unsubscribe();
  });
});
