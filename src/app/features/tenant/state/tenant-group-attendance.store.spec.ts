import { TestBed } from '@angular/core/testing';
import { TenantGroupAttendanceStore } from './tenant-group-attendance.store';

describe('TenantGroupAttendanceStore', () => {
  let store: TenantGroupAttendanceStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupAttendanceStore);
    store.loadGroup('g-1');
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
});
