import { TestBed } from '@angular/core/testing';
import { TenantGradeDetailsStore } from './tenant-grade-details.store';

describe('TenantGradeDetailsStore', () => {
  let store: TenantGradeDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGradeDetailsStore);
  });

  it('loads grade details and groups', () => {
    store.loadGrade('2');

    expect(store.grade()?.name).toBe('Grade 11');
    expect(store.groups().length).toBe(4);
  });
});
