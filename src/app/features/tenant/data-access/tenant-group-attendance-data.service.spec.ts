import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TestBed } from '@angular/core/testing';
import { TenantGroupAttendanceDataService } from './tenant-group-attendance-data.service';

describe('TenantGroupAttendanceDataService', () => {
  let service: TenantGroupAttendanceDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantGroupAttendanceDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('returns student rows scoped to the requested group id', () => {
    const englishStudents = service.getStudentsByGroupId('english-g9-a');
    const physicsStudents = service.getStudentsByGroupId('physics-g11-c');

    expect(englishStudents.length).toBeGreaterThan(0);
    expect(physicsStudents.length).toBeGreaterThan(0);
    expect(englishStudents.map((student) => student.id)).not.toEqual(physicsStudents.map((student) => student.id));
    expect(englishStudents[0]).toEqual(
      expect.objectContaining({
        rfid: expect.any(String),
        barcode: expect.any(String),
        attendanceState: 'Absent',
        manualStatus: 'Manual',
        overrideChecks: 'Ready',
      }),
    );
  });

  it('returns independent copies so group card changes do not mutate source data', () => {
    const students = service.getStudentsByGroupId('english-g9-a');

    students[0] = { ...students[0], name: 'Changed Name' };

    expect(service.getStudentsByGroupId('english-g9-a')[0].name).not.toBe('Changed Name');
  });

  it('returns an empty collection for null or unknown groups', () => {
    expect(service.getStudentsByGroupId(null)).toEqual([]);
    expect(service.getStudentsByGroupId('unknown-group')).toEqual([]);
  });


  it('posts barcode scan requests to the tenant attendance endpoint', () => {
    service.scanBarcode({ barcodeNumber: '10001', selectedGroupId: 'group-1' }).subscribe((response) => {
      expect(response).toEqual({
        result: 'PRESENT_RECORDED',
        message: 'Ahmed Ali present Physics G12-A',
        student: { id: 'student-1', name: 'Ahmed Ali', barcodeNumber: '10001' },
        group: { id: 'group-1', name: 'Physics G12-A', startTime: '04:00', duration: 60 },
        attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-05T04:45:00+03:00', sessionDate: '2026-06-05' },
      });
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/attendance/barcode-scans`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ barcodeNumber: '10001', selectedGroupId: 'group-1' });
    request.flush({
      result: 'PRESENT_RECORDED',
      message: 'Ahmed Ali present Physics G12-A',
      student: { id: 'student-1', name: 'Ahmed Ali', barcodeNumber: '10001' },
      group: { id: 'group-1', name: 'Physics G12-A', startTime: '04:00', duration: 60 },
      attendance: { state: 'Present', source: 'Auto', scanTime: '2026-06-05T04:45:00+03:00', sessionDate: '2026-06-05' },
    });
  });
  it('posts manual attendance checks to the tenant attendance endpoint', () => {
    service.saveManualAttendance({ groupId: 'group-1', studentId: 'student-1', attendanceState: 'Absent' }).subscribe((response) => {
      expect(response).toEqual({
        groupId: 'group-1',
        studentId: 'student-1',
        attendanceState: 'Absent',
        source: 'Manual',
        scanTime: '2026-06-05T07:01:00+03:00',
        sessionDate: '2026-06-05',
        message: 'Manual attendance saved',
      });
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/attendance/manual-checks`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ groupId: 'group-1', studentId: 'student-1', attendanceState: 'Absent' });
    request.flush({
      groupId: 'group-1',
      studentId: 'student-1',
      attendanceState: 'Absent',
      source: 'Manual',
      scanTime: '2026-06-05T07:01:00+03:00',
      sessionDate: '2026-06-05',
      message: 'Manual attendance saved',
    });
  });

  it('loads enrolled students from the group details endpoint as attendance rows', () => {
    service.loadStudentsByGroupId('science-g-1').subscribe((students) => {
      expect(students).toEqual([
        expect.objectContaining({
          id: 'student-1',
          name: 'Ahmed Ali',
          rfid: null,
          barcode: '10001',
          attendanceState: 'Absent',
          manualStatus: 'Manual',
          overrideChecks: 'Ready',
        }),
      ]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/science-g-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'science-g-1',
      name: 'SCINCE G-1',
      subject: 'Science',
      teacher: 'Mohamed Hussein',
      room: 'Room 102',
      schedule: 'Monday 10:00',
      capacity: 10,
      enrolled: 1,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 500,
      currency: 'EGP',
      students: [{ id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', barcodeNumber: '10001', attendanceRate: null, lastAttendance: '' }],
    });
  });
  it('maps saved attendance state from group details into attendance rows', () => {
    service.loadStudentsByGroupId('science-g-1').subscribe((students) => {
      expect(students[0]).toEqual(
        expect.objectContaining({
          id: 'student-1',
          name: 'abdo',
          barcode: '000000000001',
          isPresent: true,
          attendanceState: 'Present',
          manualStatus: 'Auto',
        }),
      );
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/science-g-1`);
    request.flush({
      id: 'science-g-1',
      name: 'SCINCE G-1',
      subject: 'Science',
      teacher: 'Mohamed Hussein',
      room: 'Room 102',
      schedule: 'Monday 10:00',
      capacity: 10,
      enrolled: 1,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 500,
      currency: 'EGP',
      students: [
        {
          id: 'student-1',
          name: 'abdo',
          email: 'abdo@example.com',
          barcodeNumber: '000000000001',
          attendanceRate: null,
          lastAttendance: '',
          attendanceState: 'Present',
          attendanceSource: 'Auto',
        },
      ],
    });
  });

  it('fills missing attendance barcodes from student details', () => {
    service.loadStudentsByGroupId('science-g-1').subscribe((students) => {
      expect(students[0]).toEqual(
        expect.objectContaining({
          id: 'student-1',
          name: 'Ahmed Ali',
          barcode: '000000000123',
        }),
      );
    });

    const groupRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/science-g-1`);
    expect(groupRequest.request.method).toBe('GET');
    groupRequest.flush({
      id: 'science-g-1',
      name: 'SCINCE G-1',
      subject: 'Science',
      teacher: 'Mohamed Hussein',
      room: 'Room 102',
      schedule: 'Monday 10:00',
      capacity: 10,
      enrolled: 1,
      pricePerStudent: 500,
      status: 'Active',
      avgAttendanceRate: null,
      absenceRate: null,
      attendanceAvailable: false,
      monthlyRevenue: 500,
      currency: 'EGP',
      students: [{ id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', barcodeNumber: null, attendanceRate: null, lastAttendance: '' }],
    });

    const studentRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/students/student-1`);
    expect(studentRequest.request.method).toBe('GET');
    studentRequest.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      barcodeNumber: '000000000123',
      educationCategory: 'BASIC_EDUCATION',
      createdAt: '2026-06-05T00:00:00Z',
    });
  });
});
