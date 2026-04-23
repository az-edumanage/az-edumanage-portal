import { TestBed } from '@angular/core/testing';
import { TenantGroupDetailsStore } from './tenant-group-details.store';

describe('TenantGroupDetailsStore', () => {
  let store: TenantGroupDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupDetailsStore);
  });

  it('loads group details and seeded students', () => {
    store.loadGroup('1');

    expect(store.group()?.name).toBe('Physics G12-A');
    expect(store.students().length).toBe(5);
  });
});
