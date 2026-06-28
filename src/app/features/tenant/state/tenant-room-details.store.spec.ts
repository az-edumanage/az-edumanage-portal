import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TenantRoomDetailsDataService } from '../data-access/tenant-room-details-data.service';
import { TenantRoomDetailsStore } from './tenant-room-details.store';

describe('TenantRoomDetailsStore', () => {
  let store: TenantRoomDetailsStore;
  let dataService: {
    getRoomById: ReturnType<typeof vi.fn>;
    getScheduleByRoomId: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getRoomById: vi.fn().mockResolvedValue({
        id: 'room-1',
        name: 'Room 101',
        type: 'Classroom',
        capacity: 30,
        status: 'Available',
        equipment: ['Projector'],
        notes: '',
      }),
      getScheduleByRoomId: vi.fn().mockResolvedValue([
        {
          id: 'group-1:Monday:10:00',
          groupId: 'group-1',
          day: 'Monday',
          time: '10:00 AM - 11:30 AM',
          group: 'Physics G12-A',
          teacher: 'Sarah Nabil',
          subject: 'Physics',
          studentsCount: 0,
          durationHours: 1.5,
        },
      ]),
      toUserMessage: vi.fn().mockReturnValue('Unable to load room details. Please try again.'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TenantRoomDetailsDataService, useValue: dataService }],
    });
    store = TestBed.inject(TenantRoomDetailsStore);
  });

  it('loads real room details and computes occupancy stats from real schedule rows', async () => {
    await store.loadRoom('room-1');

    expect(dataService.getRoomById).toHaveBeenCalledWith('room-1');
    expect(dataService.getScheduleByRoomId).toHaveBeenCalledWith('room-1');
    expect(store.room()?.name).toBe('Room 101');
    expect(store.schedule().length).toBe(1);
    expect(store.totalOccupiedHours()).toBeGreaterThan(0);
    expect(store.occupancyRate()).toBeGreaterThan(0);
  });

  it('keeps schedule empty when the room has no real schedule rows', async () => {
    dataService.getScheduleByRoomId.mockResolvedValue([]);

    await store.loadRoom('room-2');

    expect(store.schedule()).toEqual([]);
    expect(store.totalOccupiedHours()).toBe(0);
    expect(store.occupiedDaysCount()).toBe(0);
  });

  it('counts students once per group when the same group has multiple room schedule rows', async () => {
    dataService.getScheduleByRoomId.mockResolvedValue([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        day: 'Monday',
        time: '10:00 AM - 11:30 AM',
        group: 'Physics G12-A',
        teacher: 'Sarah Nabil',
        subject: 'Physics',
        studentsCount: 3,
        durationHours: 1.5,
      },
      {
        id: 'group-1:Wednesday:10:00',
        groupId: 'group-1',
        day: 'Wednesday',
        time: '10:00 AM - 11:30 AM',
        group: 'Physics G12-A',
        teacher: 'Sarah Nabil',
        subject: 'Physics',
        studentsCount: 3,
        durationHours: 1.5,
      },
      {
        id: 'group-1:Friday:10:00',
        groupId: 'group-1',
        day: 'Friday',
        time: '10:00 AM - 11:30 AM',
        group: 'Physics G12-A',
        teacher: 'Sarah Nabil',
        subject: 'Physics',
        studentsCount: 3,
        durationHours: 1.5,
      },
    ]);

    await store.loadRoom('room-1');

    expect(store.schedule().length).toBe(3);
    expect(store.uniqueGroupsCount()).toBe(1);
    expect(store.totalStudents()).toBe(3);
    expect(store.avgGroupSize()).toBe(3);
  });

  it('clears stale room and schedule data when loading fails', async () => {
    await store.loadRoom('room-1');
    dataService.getRoomById.mockRejectedValue(new Error('Failed'));

    await store.loadRoom('room-2');

    expect(store.room()).toBeNull();
    expect(store.schedule()).toEqual([]);
    expect(store.error()).toBe('Unable to load room details. Please try again.');
  });
});
