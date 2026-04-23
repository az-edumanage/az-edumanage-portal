import { TestBed } from '@angular/core/testing';
import { TenantGroupsStore } from './tenant-groups.store';

describe('TenantGroupsStore', () => {
  let store: TenantGroupsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupsStore);
  });

  it('filters groups by subject and teacher', () => {
    store.subjectFilter.set('Physics');
    store.teacherFilter.set('Dr. Ahmed Zewail');

    const filtered = store.filteredGroups();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Physics G12-A');
  });

  it('sorts by student count descending', () => {
    store.sortBy.set('students-desc');
    const filtered = store.filteredGroups();
    expect(filtered[0].studentsCount).toBe(30);
  });
});
