import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantStudentsDataService } from './tenant-students-data.service';

describe('TenantStudentsDataService', () => {
  let service: TenantStudentsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TenantStudentsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads and maps backend student records', () => {
    service.loadStudents().subscribe((students) => {
      expect(students).toEqual([
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          grade: 'Grade 10',
          stage: 'Primary Stage',
          status: 'Active',
          enrollmentDate: 'Jun 2026',
        },
      ]);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'student-1',
        fullName: 'Ahmed Ali',
        email: 'ahmed@example.com',
        educationCategory: 'BASIC_EDUCATION',
        stageName: 'Primary Stage',
        gradeName: 'Grade 10',
        createdAt: '2026-06-01T10:00:00Z',
      },
    ]);
  });

  it('resolves assigned grade and stage names from ids when the student response only has education category', () => {
    service.loadStudents().subscribe((students) => {
      expect(students[0]).toEqual(expect.objectContaining({
        grade: 'Grade 10',
        gradeId: 'grade-1',
        stage: 'Primary Stage',
        stageId: 'stage-1',
      }));
    });

    const studentsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    studentsRequest.flush([
      {
        id: 'student-1',
        fullName: 'Ahmed Ali',
        email: 'ahmed@example.com',
        educationCategory: 'BASIC_EDUCATION',
        stageIds: ['stage-1'],
        gradeIds: ['grade-1'],
        createdAt: '2026-06-01T10:00:00Z',
      },
    ]);

    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades')).flush([
      {
        id: 'grade-1',
        name: 'Grade 10',
        description: null,
        level: '10',
        stageId: 'stage-1',
        countryId: 'country-1',
        country: 'Egypt',
        countryCode: 'EG',
        studentCount: 1,
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
        groups: [],
      },
    ]);
    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages')).flush([
      {
        id: 'stage-1',
        name: 'Primary Stage',
        code: null,
        order: 1,
        status: 'Active',
        countryId: 'country-1',
        country: 'Egypt',
        countryCode: 'EG',
        gradeCount: 1,
        classCount: 0,
        description: '',
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
    ]);
  });

  it('keeps empty backend responses empty', () => {
    service.loadStudents().subscribe((students) => {
      expect(students).toEqual([]);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    request.flush([]);
  });

  it('loads one student detail record', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student).toEqual(expect.objectContaining({
        id: 'student-1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
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
        ],
      }));
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      phone: '+201000000000',
      barcodeNumber: '000000000123',
      gender: 'Male',
      birthDate: '2008-01-10',
      parentName: 'Parent Ali',
      parentPhone: '+201000000001',
      address: 'Cairo',
      notifyParent: true,
      educationCategory: 'BASIC_EDUCATION',
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
      ],
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('maps backend snake case barcode fields in student details', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student.barcodeNumber).toBe('000000000456');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      barcode_number: '000000000456',
      educationCategory: 'BASIC_EDUCATION',
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('defaults missing student schedule fields safely', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student.scheduleSummary).toEqual({
        attendanceLabel: '0%',
        attendanceProgress: 0,
        scheduleDaysCount: 0,
        totalGroups: 0,
        groupsCount: 0,
      });
      expect(student.scheduleRows).toEqual([]);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      educationCategory: 'BASIC_EDUCATION',
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('maps student schedule summary fields and clamps attendance progress', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student.scheduleSummary.attendanceLabel).toBe('125%');
      expect(student.scheduleSummary.attendanceProgress).toBe(100);
      expect(student.scheduleSummary.scheduleDaysCount).toBe(3);
      expect(student.scheduleSummary.totalGroups).toBe(2);
      expect(student.scheduleSummary.groupsCount).toBe(2);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      educationCategory: 'BASIC_EDUCATION',
      scheduleSummary: {
        attendanceLabel: '125%',
        attendanceProgress: 125,
        scheduleDaysCount: 3,
        totalGroups: 2,
        groupsCount: 2,
      },
      scheduleRows: [],
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('maps student schedule rows from the backend detail response', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student.scheduleRows).toEqual([
        {
          groupId: 'group-2',
          group: 'Chemistry G12-B',
          day: 'Friday',
          time: '12:00 PM (60 min)',
          roomId: 'room-2',
          room: 'Room 102',
          teacherId: 'teacher-2',
          teacher: 'Dr. Mona',
        },
      ]);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      educationCategory: 'BASIC_EDUCATION',
      scheduleRows: [
        {
          groupId: 'group-2',
          group: 'Chemistry G12-B',
          day: 'Friday',
          time: '12:00 PM (60 min)',
          roomId: 'room-2',
          room: 'Room 102',
          teacherId: 'teacher-2',
          teacher: 'Dr. Mona',
        },
      ],
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('keeps existing student detail fields mapped unchanged with schedule data present', () => {
    service.getStudent('student-1').subscribe((student) => {
      expect(student.id).toBe('student-1');
      expect(student.name).toBe('Ahmed Ali');
      expect(student.email).toBe('ahmed@example.com');
      expect(student.grade).toBe('Basic Education');
      expect(student.status).toBe('Active');
      expect(student.enrollmentDate).toBe('Jun 2026');
      expect(student.phone).toBe('+201000000000');
      expect(student.barcodeNumber).toBe('000000000123');
      expect(student.gender).toBe('Male');
      expect(student.birthDate).toBe('Jan 10, 2008');
      expect(student.parentName).toBe('Parent Ali');
      expect(student.parentPhone).toBe('+201000000001');
      expect(student.address).toBe('Cairo');
      expect(student.notifyParent).toBe(true);
      expect(student.educationCategory).toBe('Basic Education');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students/student-1'));
    request.flush({
      id: 'student-1',
      fullName: 'Ahmed Ali',
      email: 'ahmed@example.com',
      phone: '+201000000000',
      barcodeNumber: '000000000123',
      gender: 'Male',
      birthDate: '2008-01-10',
      parentName: 'Parent Ali',
      parentPhone: '+201000000001',
      address: 'Cairo',
      notifyParent: true,
      educationCategory: 'BASIC_EDUCATION',
      scheduleSummary: {
        attendanceLabel: '0%',
        attendanceProgress: 0,
        scheduleDaysCount: 1,
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
      ],
      createdAt: '2026-06-01T10:00:00Z',
    });
  });

  it('maps education fallback and invalid created date safely', () => {
    service.loadStudents().subscribe((students) => {
      expect(students[0]).toEqual(expect.objectContaining({
        grade: 'University Education',
        status: 'Active',
        enrollmentDate: '',
      }));
      expect(students[1]).toEqual(expect.objectContaining({
        grade: 'Education',
        enrollmentDate: '',
      }));
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    request.flush([
      {
        id: 'student-2',
        fullName: 'University Student',
        email: 'university@example.com',
        educationCategory: 'UNIVERSITY_EDUCATION',
        createdAt: 'not-a-date',
      },
      {
        id: 'student-3',
        fullName: 'No Assignment',
        email: 'missing@example.com',
        educationCategory: null,
        createdAt: null,
      },
    ]);
  });

  it('uses assigned stage when grade name is unavailable', () => {
    service.loadStudents().subscribe((students) => {
      expect(students[0].grade).toBe('Primary Stage');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    request.flush([
      {
        id: 'student-4',
        fullName: 'Stage Only',
        email: 'stage@example.com',
        educationCategory: 'BASIC_EDUCATION',
        stage_name: 'Primary Stage',
        createdAt: '2026-06-01T10:00:00Z',
      },
    ]);
  });
});
