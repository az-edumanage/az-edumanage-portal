import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TenantGroupAttendanceDataService } from '../data-access/tenant-group-attendance-data.service';
import { TenantAttendanceStudent } from '../models/tenant-group-attendance.models';
import { TenantGroupAttendanceStore } from './tenant-group-attendance.store';

describe('TenantGroupAttendanceStore', () => {
  let store: TenantGroupAttendanceStore;
  const students: TenantAttendanceStudent[] = [
    createStudent('student-1', 'Ahmed Ali', true),
    createStudent('student-2', 'Sara Mohamed', true),
    createStudent('student-3', 'Omar Hassan', true),
    createStudent('student-4', 'Laila Mahmoud', false),
    createStudent('student-5', 'Youssef Ibrahim', false),
  ];
  const data = {
    loadGroupAttendance: vi.fn(),
    saveAttendance: vi.fn(),
  };

  beforeEach(async () => {
    data.loadGroupAttendance.mockReset();
    data.loadGroupAttendance.mockReturnValue(of({ attendanceAvailable: true, students }));
    data.saveAttendance.mockReset();
    data.saveAttendance.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: TenantGroupAttendanceDataService, useValue: data }],
    });
    store = TestBed.inject(TenantGroupAttendanceStore);
    await store.loadGroup('g-1');
  });

  it('loads enrolled students from the backend-backed group attendance service', () => {
    expect(data.loadGroupAttendance).toHaveBeenCalledWith('g-1');
    expect(store.students()).toEqual(students);
    expect(store.attendanceAvailable()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('computes summary counts from attendance states', () => {
    expect(store.presentCount()).toBe(3);
    expect(store.absentCount()).toBe(2);
    expect(store.attendanceRate()).toBe(60);
  });

  it('marks all students as present', () => {
    store.markAll(true);

    expect(store.presentCount()).toBe(store.students().length);
    expect(store.absentCount()).toBe(0);
    expect(store.attendanceRate()).toBe(100);
  });

  it('stores load errors and leaves the page with an empty student list', async () => {
    data.loadGroupAttendance.mockReturnValue(throwError(() => new Error('Unable to load group')));

    await store.loadGroup('missing-group');

    expect(store.students()).toEqual([]);
    expect(store.attendanceAvailable()).toBe(false);
    expect(store.error()).toBe('Unable to load group');
    expect(store.isLoading()).toBe(false);
  });

  it('does not mutate or save attendance before the current group session starts', async () => {
    data.loadGroupAttendance.mockReturnValue(of({ attendanceAvailable: false, students }));
    await store.loadGroup('g-1');

    store.toggleAttendance('student-4', true);
    store.markAll(true);
    await store.saveAttendance();

    expect(store.presentCount()).toBe(3);
    expect(data.saveAttendance).not.toHaveBeenCalled();
    expect(store.attendanceBlockedMessage()).toContain('current group session starts');
  });
});

function createStudent(id: string, name: string, isPresent: boolean): TenantAttendanceStudent {
  return {
    id,
    name,
    rfid: null,
    barcode: null,
    isPresent,
    attendanceState: isPresent ? 'Present' : 'Absent',
    attendanceTime: '',
    manualStatus: 'Manual',
    overrideChecks: 'Ready',
    attendanceRate: isPresent ? 90 : 70,
    totalSessions: 10,
    attendedSessions: isPresent ? 9 : 7,
  };
}
