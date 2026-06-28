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
      expect(group.stageId).toBe('stage-1');
      expect(group.gradeId).toBe('grade-1');
      expect(group.avgAttendanceRate).toBeNull();
      expect(group.absenceRate).toBeNull();
      expect(group.attendanceAvailable).toBe(false);
      expect(group.monthlyRevenue).toBe(1500);
      expect(group.currency).toBe('EGP');
      expect(group.startAt).toBe('10:00');
      expect(group.duration).toBe(90);
      expect(group.scheduleDays).toEqual(['Monday', 'Wednesday']);
      expect(group.daySchedules).toEqual({
        Monday: { startTime: '10:00', endTime: '11:30', room: 'Lab 101', roomId: 'room-1' },
      });
      expect(group.calendarEvents).toEqual([
        {
          id: 'group-123:2026-06-08:10:00',
          date: '2026-06-08',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:30',
          room: 'Lab 101',
        },
      ]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-123',
      name: 'Physics G12-A',
      subject: 'Physics',
      stageId: 'stage-1',
      gradeId: 'grade-1',
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
      startAt: '10:00',
      duration: 90,
      scheduleDays: ['Monday', 'Wednesday'],
      daySchedules: {
        Monday: { startTime: '10:00', endTime: '11:30', room: 'Lab 101', roomId: 'room-1' },
      },
      calendarEvents: [
        {
          id: 'group-123:2026-06-08:10:00',
          date: '2026-06-08',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:30',
          room: 'Lab 101',
        },
      ],
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
          attendanceTime: null,
          attendanceState: null,
          attendanceSource: null,
        },
        {
          id: 'student-2',
          name: 'Sara Mohamed',
          email: 'sara@example.com',
          barcodeNumber: null,
          attendanceRate: 87,
          lastAttendance: '2026-05-31',
          attendanceTime: '2026-05-31T10:05:00+03:00',
          attendanceState: 'Present',
          attendanceSource: 'Auto',
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
          attendanceTime: '2026-05-31T10:05:00+03:00',
          attendanceState: 'Present',
          attendanceSource: 'Auto',
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

  it('requests and maps group exam rows from the group exams endpoint', () => {
    const actual = service.loadGroupExams('group-123').subscribe((exams) => {
      expect(exams).toEqual([
        {
          id: 'assignment-1',
          groupId: 'group-123',
          examId: 'exam-1',
          title: 'Physics Midterm',
          status: 'PUBLISHED',
          date: '2026-07-01',
          startTime: '09:30',
          duration: 60,
          questionCount: 24,
          instructions: 'Read carefully',
          updatedAt: '2026-06-27T08:45:00Z',
          settings: {
            showResultsImmediately: false,
            allowRetakes: false,
          },
        },
      ]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/exams`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'assignment-1',
        groupId: 'group-123',
        examId: 'exam-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        date: '2026-07-01',
        startTime: '09:30',
        duration: 60,
        questionCount: 24,
        instructions: 'Read carefully',
        updatedAt: '2026-06-27T08:45:00Z',
        settings: {
          showResultsImmediately: false,
          allowRetakes: false,
        },
      },
    ]);

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

  it('loads persisted group lessons without requesting curriculum sync by default', () => {
    const actual = service.loadGroupLessons('group-123', { sync: false }).subscribe((lessons) => {
      expect(lessons).toEqual([
        {
          id: 'group-lesson-1',
          curriculumNodeId: 'lesson-1',
          title: 'Lesson one',
          path: 'Physics / Unit one',
          description: null,
          completed: true,
        },
      ]);
    });

    const request = httpTesting.expectOne((req) =>
      req.url === `${environment.apiBaseUrl}/tenant/groups/group-123/lessons` && !req.params.has('sync'),
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'group-lesson-1',
        curriculumNodeId: 'lesson-1',
        title: 'Lesson one',
        path: 'Physics / Unit one',
        description: null,
        completed: true,
      },
    ]);

    actual.unsubscribe();
  });

  it('can explicitly request backend lesson sync when needed', () => {
    const actual = service.loadGroupLessons('group-123', { sync: true }).subscribe((lessons) => {
      expect(lessons).toEqual([]);
    });

    const request = httpTesting.expectOne((req) =>
      req.url === `${environment.apiBaseUrl}/tenant/groups/group-123/lessons` && req.params.get('sync') === 'true',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);

    actual.unsubscribe();
  });

  it('can scope group lessons to a session', () => {
    const sessionId = 'group-123:2026-06-13:10:00';
    const actual = service.loadGroupLessons('group-123', { sessionId }).subscribe((lessons) => {
      expect(lessons).toEqual([]);
    });

    const request = httpTesting.expectOne((req) =>
      req.url === `${environment.apiBaseUrl}/tenant/groups/group-123/lessons`
      && req.params.get('sessionId') === sessionId
      && !req.params.has('sync'),
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);

    actual.unsubscribe();
  });

  it('sends the session id when adding a session lesson', () => {
    const sessionId = 'group-123:2026-06-13:10:00';
    const actual = service.addGroupLesson('group-123', 'lesson-1', { sessionId }).subscribe((lesson) => {
      expect(lesson.id).toBe('group-lesson-1');
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/lessons`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ curriculumNodeId: 'lesson-1', sessionId });
    request.flush({
      id: 'group-lesson-1',
      curriculumNodeId: 'lesson-1',
      title: 'Lesson one',
      path: 'Physics / Unit one',
      description: null,
    });

    actual.unsubscribe();
  });

  it('removes a group lesson by id', () => {
    const actual = service.deleteGroupLesson('group-123', 'group-lesson-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/lessons/group-lesson-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    actual.unsubscribe();
  });

  it('updates lesson completion by id', () => {
    const actual = service.updateGroupLessonCompletion('group-123', 'group-lesson-1', true).subscribe((lesson) => {
      expect(lesson.completed).toBe(true);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/lessons/group-lesson-1/completion`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completed: true });
    request.flush({
      id: 'group-lesson-1',
      curriculumNodeId: 'lesson-1',
      title: 'Lesson one',
      path: 'Physics / Unit one',
      description: null,
      completed: true,
    });

    actual.unsubscribe();
  });
});
