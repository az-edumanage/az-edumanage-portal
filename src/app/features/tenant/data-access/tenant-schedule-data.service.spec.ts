import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TenantScheduleDataService } from './tenant-schedule-data.service';

describe('TenantScheduleDataService', () => {
  let service: TenantScheduleDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantScheduleDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('maps backend schedule sessions and assigns existing frontend color classes', () => {
    service.loadSessions().subscribe((sessions) => {
      expect(sessions.length).toBe(2);
      expect(sessions[0]).toEqual({
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        subjectName: 'Physics',
        teacherName: 'Dr. Ahmed Zewail',
        roomId: 'room-1',
        roomName: 'Lab 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
        studentsCount: 25,
        color: 'bg-indigo-500 text-white',
      });
      expect(sessions[1].color).toBe('bg-emerald-500 text-white');
      expect(service.sessions()).toEqual(sessions);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/schedule`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        subjectName: 'Physics',
        teacherName: 'Dr. Ahmed Zewail',
        roomId: 'room-1',
        roomName: 'Lab 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
        studentsCount: 25,
      },
      {
        id: 'group-2:Tuesday:12:00',
        groupId: 'group-2',
        groupName: 'Math G11-B',
        subjectName: 'Mathematics',
        teacherName: 'Prof. Mona Helmy',
        roomId: 'room-2',
        roomName: 'Room 204',
        day: 'Tuesday',
        startTime: '12:00',
        duration: 60,
        studentsCount: 18,
      },
    ]);
  });

  it('keeps sessions empty when the backend returns no sessions', () => {
    service.loadSessions().subscribe((sessions) => {
      expect(sessions).toEqual([]);
      expect(service.sessions()).toEqual([]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/schedule`);
    request.flush([]);
  });

  it('preserves backend startTime values for attendance time-slot derivation', () => {
    service.loadSessions().subscribe((sessions) => {
      expect(sessions.map((session) => session.startTime)).toEqual(['23:30', '00:15', '11:30 PM']);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/schedule`);
    request.flush([
      {
        id: 'group-1:Monday:23:30',
        groupId: 'group-1',
        groupName: 'English G9-A',
        teacherName: 'Teacher One',
        roomName: 'Room 201',
        day: 'Monday',
        startTime: '23:30',
        duration: 60,
      },
      {
        id: 'group-2:Tuesday:00:15',
        groupId: 'group-2',
        groupName: 'Physics G11-C',
        teacherName: 'Teacher Two',
        roomName: 'Room 202',
        day: 'Tuesday',
        startTime: '00:15',
        duration: 60,
      },
      {
        id: 'group-3:Wednesday:11:30 PM',
        groupId: 'group-3',
        groupName: 'Chemistry G10-A',
        teacherName: 'Teacher Three',
        roomName: 'Room 203',
        day: 'Wednesday',
        startTime: '11:30 PM',
        duration: 60,
      },
    ]);
  });
});
