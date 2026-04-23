import { TestBed } from '@angular/core/testing';
import { TenantStudentsStore } from './tenant-students.store';

describe('TenantStudentsStore', () => {
  let store: TenantStudentsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantStudentsStore);
  });

  it('filters by grade and status', () => {
    store.gradeFilter.set('Grade 12');
    store.statusFilter.set('Active');

    const filtered = store.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Ahmed Ali');
  });

  it('supports sort by newest enrollment date', () => {
    store.sortBy.set('date-desc');
    const filtered = store.filteredStudents();
    expect(filtered[0].enrollmentDate).toBe('Jan 2024');
  });
});
