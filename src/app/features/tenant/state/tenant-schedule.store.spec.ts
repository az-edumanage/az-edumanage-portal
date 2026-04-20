import { TestBed } from '@angular/core/testing';
import { TenantScheduleStore } from './tenant-schedule.store';

describe('TenantScheduleStore', () => {
  let store: TenantScheduleStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantScheduleStore);
  });

  it('returns all sessions when no filters are active', () => {
    expect(store.filteredSessions().length).toBe(8);
    expect(store.activeFiltersCount()).toBe(0);
  });

  it('filters sessions by selected teacher', () => {
    store.filters.set({ teacher: 'Dr. Ahmed Zewail', room: '', day: '' });

    const filtered = store.filteredSessions();
    expect(filtered.length).toBe(2);
    expect(filtered.every((session) => session.teacherName === 'Dr. Ahmed Zewail')).toBe(true);
    expect(store.activeFiltersCount()).toBe(1);
  });
});
