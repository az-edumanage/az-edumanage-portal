import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { TenantScheduleDataService } from '../data-access/tenant-schedule-data.service';
import { ScheduleSession } from '../models/tenant-schedule.models';
import { TenantScheduleFacade } from './tenant-schedule.facade';
import { TenantScheduleStore } from './tenant-schedule.store';

const sameSlotTwoSessions: ScheduleSession[] = [
  {
    id: 'group-3:Monday:10:00',
    groupId: 'group-3',
    groupName: 'Chemistry G12-C',
    teacherName: 'Dr. Samir Nassar',
    roomName: 'Lab 201',
    day: 'Monday',
    startTime: '10:00',
    duration: 60,
    color: 'bg-rose-500 text-white',
  },
  {
    id: 'group-4:Monday:10:00',
    groupId: 'group-4',
    groupName: 'Biology G12-D',
    teacherName: 'Dr. Laila Fahmy',
    roomName: 'Lab 202',
    day: 'Monday',
    startTime: '10:00',
    duration: 60,
    color: 'bg-cyan-500 text-white',
  },
];

const sameSlotFiveSessions: ScheduleSession[] = [
  ...sameSlotTwoSessions,
  {
    id: 'group-5:Monday:10:00',
    groupId: 'group-5',
    groupName: 'English G12-E',
    teacherName: 'Mr. Youssef Adel',
    roomName: 'Room 301',
    day: 'Monday',
    startTime: '10:00',
    duration: 60,
    color: 'bg-violet-500 text-white',
  },
  {
    id: 'group-6:Monday:10:00',
    groupId: 'group-6',
    groupName: 'Arabic G12-F',
    teacherName: 'Ms. Sara Amin',
    roomName: 'Room 302',
    day: 'Monday',
    startTime: '10:00',
    duration: 60,
    color: 'bg-sky-500 text-white',
  },
  {
    id: 'group-7:Monday:10:00',
    groupId: 'group-7',
    groupName: 'History G12-G',
    teacherName: 'Mr. Omar Hassan',
    roomName: 'Room 303',
    day: 'Monday',
    startTime: '10:00',
    duration: 60,
    color: 'bg-lime-500 text-white',
  },
];

describe('TenantScheduleStore', () => {
  let store: TenantScheduleStore;
  let facade: TenantScheduleFacade;
  let sessions: WritableSignal<ScheduleSession[]>;
  let dataService: {
    sessions: WritableSignal<ScheduleSession[]>;
    loadSessions: () => Observable<ScheduleSession[]>;
  };
  let loadSessionsCalls: number;

  beforeEach(() => {
    sessions = signal<ScheduleSession[]>([
      {
        id: 'group-1:Monday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        teacherName: 'Dr. Ahmed Zewail',
        roomName: 'Lab 101',
        day: 'Monday',
        startTime: '10:00',
        duration: 90,
        color: 'bg-indigo-500 text-white',
      },
      {
        id: 'group-1:Wednesday:10:00',
        groupId: 'group-1',
        groupName: 'Physics G12-A',
        teacherName: 'Dr. Ahmed Zewail',
        roomName: 'Lab 101',
        day: 'Wednesday',
        startTime: '10:00',
        duration: 90,
        color: 'bg-emerald-500 text-white',
      },
      {
        id: 'group-2:Monday:12:00',
        groupId: 'group-2',
        groupName: 'Math G11-B',
        teacherName: 'Prof. Mona Helmy',
        roomName: 'Room 204',
        day: 'Monday',
        startTime: '12:00',
        duration: 60,
        color: 'bg-amber-500 text-white',
      },
    ]);
    loadSessionsCalls = 0;
    dataService = {
      sessions,
      loadSessions: () => {
        loadSessionsCalls++;
        return of([]);
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TenantScheduleDataService, useValue: dataService }],
    });
    store = TestBed.inject(TenantScheduleStore);
    facade = TestBed.inject(TenantScheduleFacade);
  });

  it('returns all sessions when no filters are active', () => {
    expect(store.filteredSessions().length).toBe(3);
    expect(store.activeFiltersCount()).toBe(0);
  });

  it('filters sessions by selected teacher', () => {
    store.filters.set({ teacher: 'Dr. Ahmed Zewail', room: '', day: '' });

    const filtered = store.filteredSessions();
    expect(filtered.length).toBe(2);
    expect(filtered.every((session) => session.teacherName === 'Dr. Ahmed Zewail')).toBe(true);
    expect(store.activeFiltersCount()).toBe(1);
  });

  it('places backend-loaded schedule sessions in the matching day and time slot', () => {
    const sessionsForCell = facade.getSessionsFor('Wednesday', '10:00');

    expect(sessionsForCell.length).toBe(1);
    expect(sessionsForCell[0].groupName).toBe('Physics G12-A');
    expect(sessionsForCell[0].groupId).toBe('group-1');
  });

  it('returns multiple sessions for the same day and time slot', () => {
    sessions.set(sameSlotFiveSessions);

    const sessionsForCell = facade.getSessionsFor('Monday', '10:00');

    expect(sessionsForCell.length).toBe(5);
    expect(sessionsForCell.map((session) => session.groupId)).toEqual([
      'group-3',
      'group-4',
      'group-5',
      'group-6',
      'group-7',
    ]);
  });

  it('renders no mock sessions when the backend returns an empty response', () => {
    sessions.set([]);

    expect(store.filteredSessions()).toEqual([]);
    expect(facade.getSessionsFor('Monday', '10:00')).toEqual([]);
  });

  it('keeps teacher room and day filters working with backend-loaded sessions', () => {
    store.filters.set({ teacher: 'Prof. Mona Helmy', room: 'Room 204', day: 'Monday' });

    const filtered = store.filteredSessions();
    expect(filtered.length).toBe(1);
    expect(filtered[0].groupName).toBe('Math G11-B');
    expect(store.teachers()).toEqual(['Dr. Ahmed Zewail', 'Prof. Mona Helmy']);
    expect(store.rooms()).toEqual(['Lab 101', 'Room 204']);
    expect(store.activeFiltersCount()).toBe(3);
  });

  it('filters same-slot sessions independently by teacher', () => {
    sessions.set(sameSlotTwoSessions);
    store.filters.set({ teacher: 'Dr. Laila Fahmy', room: '', day: '' });

    const sessionsForCell = facade.getSessionsFor('Monday', '10:00');

    expect(sessionsForCell.length).toBe(1);
    expect(sessionsForCell[0].groupName).toBe('Biology G12-D');
    expect(sessionsForCell[0].teacherName).toBe('Dr. Laila Fahmy');
  });

  it('filters same-slot sessions independently by room and day', () => {
    sessions.set([
      ...sameSlotTwoSessions,
      {
        id: 'group-8:Tuesday:10:00',
        groupId: 'group-8',
        groupName: 'Chemistry G11-A',
        teacherName: 'Dr. Samir Nassar',
        roomName: 'Lab 201',
        day: 'Tuesday',
        startTime: '10:00',
        duration: 60,
        color: 'bg-orange-500 text-white',
      },
    ]);
    store.filters.set({ teacher: '', room: 'Lab 201', day: 'Monday' });

    const mondaySessionsForCell = facade.getSessionsFor('Monday', '10:00');
    const tuesdaySessionsForCell = facade.getSessionsFor('Tuesday', '10:00');

    expect(mondaySessionsForCell.length).toBe(1);
    expect(mondaySessionsForCell[0].groupName).toBe('Chemistry G12-C');
    expect(tuesdaySessionsForCell).toEqual([]);
  });

  it('loads sessions through the data service', () => {
    store.loadSessions();

    expect(loadSessionsCalls).toBe(1);
  });
});
