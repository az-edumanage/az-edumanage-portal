import { TestBed } from '@angular/core/testing';
import { TenantTeachersStore } from './tenant-teachers.store';

describe('TenantTeachersStore', () => {
  let store: TenantTeachersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantTeachersStore);
  });

  it('filters teachers by subject and status', () => {
    store.subjectFilter.set('Physics');
    store.statusFilter.set('Active');

    const filtered = store.filteredTeachers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Dr. Ahmed Zewail');
  });

  it('tracks filter badge count', () => {
    expect(store.activeFiltersCount()).toBe(0);
    store.subjectFilter.set('Biology');
    store.statusFilter.set('Active');
    store.sortBy.set('date-desc');

    expect(store.activeFiltersCount()).toBe(3);
  });
});
