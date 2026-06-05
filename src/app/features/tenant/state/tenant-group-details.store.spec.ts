import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { GroupDetails } from '../models/tenant-group-details.models';
import { TenantGroupDetailsStore } from './tenant-group-details.store';

describe('TenantGroupDetailsStore', () => {
  let store: TenantGroupDetailsStore;
  const group: GroupDetails = {
    id: 'group-123',
    name: 'Physics G12-A',
    subject: 'Physics',
    teacher: 'Sarah Nabil',
    room: 'Lab 101',
    schedule: 'Monday 10:00',
    capacity: 25,
    enrolled: 2,
    fees: 500,
    status: 'Active',
    monthlyRevenue: 1000,
    currency: 'EGP',
    students: [
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
        attendanceRate: 0,
        lastAttendance: '',
      },
    ],
  };
  const dataService = {
    loadGroupById: vi.fn(() => of(group)),
    removeStudentFromGroup: vi.fn(() => of(null)),
  };

  beforeEach(() => {
    dataService.loadGroupById.mockReturnValue(of(group));
    dataService.removeStudentFromGroup.mockReturnValue(of(null));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TenantGroupDetailsDataService,
          useValue: dataService,
        },
      ],
    });
    store = TestBed.inject(TenantGroupDetailsStore);
  });

  it('loads group details and students from the backend payload', () => {
    store.loadGroup('group-123');

    expect(dataService.loadGroupById).toHaveBeenCalledWith('group-123');
    expect(store.group()?.name).toBe('Physics G12-A');
    expect(store.students()).toEqual(group.students);
  });

  it('does not show seeded students when the backend payload is empty', () => {
    dataService.loadGroupById.mockReturnValue(of({ ...group, enrolled: 0, monthlyRevenue: 0, students: [] }));

    store.loadGroup('group-empty');

    expect(store.students()).toEqual([]);
  });

  it('formats real decimal attendance and absence rates from group details', () => {
    dataService.loadGroupById.mockReturnValue(of({
      ...group,
      avgAttendanceRate: 66.666,
      absenceRate: 33.333,
    }));

    store.loadGroup('group-123');

    expect(store.avgAttendanceLabel()).toBe('66.666%');
    expect(store.absenceRateLabel()).toBe('33.333%');
  });

  it('clears stale group data and exposes the existing error signal when loading fails', () => {
    store.loadGroup('group-123');
    expect(store.group()?.id).toBe('group-123');
    dataService.loadGroupById.mockReturnValue(throwError(() => new Error('Group not found')));

    store.loadGroup('missing-group');

    expect(store.group()).toBeNull();
    expect(store.students()).toEqual([]);
    expect(store.selectedStudent()).toBeNull();
    expect(store.error()).toBe('Group not found');
    expect(store.isLoading()).toBe(false);
  });

  it('removes an enrolled student from the current group', () => {
    store.loadGroup('group-123');

    store.removeStudentFromGroup('group-123', group.students![0]);

    expect(dataService.removeStudentFromGroup).toHaveBeenCalledWith('group-123', 'student-1');
    expect(store.students().map((student) => student.id)).toEqual(['student-2']);
    expect(store.group()?.enrolled).toBe(1);
    expect(store.group()?.monthlyRevenue).toBe(500);
  });

  it('keeps students visible and exposes the exit error when removal fails', () => {
    dataService.removeStudentFromGroup.mockReturnValue(throwError(() => new Error('Student is not enrolled in this group')));
    store.loadGroup('group-123');

    store.removeStudentFromGroup('group-123', group.students![0]);

    expect(store.students().map((student) => student.id)).toEqual(['student-1', 'student-2']);
    expect(store.exitStudentError()).toBe('Student is not enrolled in this group');
    expect(store.exitingStudentId()).toBeNull();
  });
});
