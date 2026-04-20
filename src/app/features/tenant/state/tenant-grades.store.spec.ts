import { TestBed } from '@angular/core/testing';
import { TenantGradesStore } from './tenant-grades.store';

describe('TenantGradesStore', () => {
  let store: TenantGradesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGradesStore);
  });

  it('filters grades by level and minimum students', () => {
    store.levelFilter.set('Primary');
    store.minStudentsFilter.set(85);

    const filtered = store.filteredGrades();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Primary 2');
  });

  it('sorts by student count ascending', () => {
    store.sortBy.set('students-asc');
    const filtered = store.filteredGrades();
    expect(filtered[0].studentCount).toBe(80);
  });
});
