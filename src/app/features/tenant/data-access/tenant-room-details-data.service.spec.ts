import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantRoomDetailsDataService } from './tenant-room-details-data.service';

describe('TenantRoomDetailsDataService', () => {
  let service: TenantRoomDetailsDataService;
  let httpTesting: HttpTestingController;
  let authApi: { ensureLoggedIn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authApi = {
      ensureLoggedIn: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApi },
      ],
    });

    service = TestBed.inject(TenantRoomDetailsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads room details from the backend room endpoint', async () => {
    const resultPromise = service.getRoomById('room-1');
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/rooms/room-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'room-1',
      name: 'Room 101',
      type: 'Classroom',
      capacity: 30,
      status: 'Available',
      equipment: ['Projector'],
      notes: 'Near reception',
    });

    await expect(resultPromise).resolves.toEqual({
      id: 'room-1',
      name: 'Room 101',
      type: 'Classroom',
      capacity: 30,
      status: 'Available',
      equipment: ['Projector'],
      notes: 'Near reception',
    });
    expect(authApi.ensureLoggedIn).toHaveBeenCalled();
  });

  it('filters real schedule sessions by room id and ignores other room rows', async () => {
    const resultPromise = service.getScheduleByRoomId('room-1');
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/schedule`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        subjectName: 'Physics',
        teacherName: 'Sarah Nabil',
        roomId: 'room-1',
        roomName: 'Room 101',
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
        teacherName: 'Mona Helmy',
        roomId: 'room-2',
        roomName: 'Room 102',
        day: 'Tuesday',
        startTime: '12:00',
        duration: 60,
        studentsCount: 18,
      },
    ]);

    await expect(resultPromise).resolves.toEqual([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        day: 'Monday',
        time: '10:00 AM - 11:30 AM',
        group: 'Physics G12-A',
        teacher: 'Sarah Nabil',
        subject: 'Physics',
        studentsCount: 25,
        durationHours: 1.5,
      },
    ]);
  });

  it('returns an empty schedule when the backend has no sessions for the room', async () => {
    const resultPromise = service.getScheduleByRoomId('room-3');
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/schedule`);
    request.flush([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        subjectName: 'Physics',
        teacherName: 'Sarah Nabil',
        roomId: 'room-1',
        roomName: 'Room 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
        studentsCount: 25,
      },
    ]);

    await expect(resultPromise).resolves.toEqual([]);
  });
});
