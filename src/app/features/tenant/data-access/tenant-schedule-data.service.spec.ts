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
        teacherName: 'Dr. Ahmed Zewail',
        roomName: 'Lab 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
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
        teacherName: 'Dr. Ahmed Zewail',
        roomName: 'Lab 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
      },
      {
        id: 'group-2:Tuesday:12:00',
        groupId: 'group-2',
        groupName: 'Math G11-B',
        teacherName: 'Prof. Mona Helmy',
        roomName: 'Room 204',
        day: 'Tuesday',
        startTime: '12:00',
        duration: 60,
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
});
