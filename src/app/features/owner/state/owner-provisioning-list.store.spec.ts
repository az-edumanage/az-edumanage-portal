import { TestBed } from '@angular/core/testing';
import { OwnerProvisioningListStore } from './owner-provisioning-list.store';

describe('OwnerProvisioningListStore', () => {
  let store: OwnerProvisioningListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerProvisioningListStore);
  });

  it('returns all jobs by default', () => {
    expect(store.filter()).toBe('All');
    expect(store.filteredJobs().length).toBe(5);
  });

  it('filters jobs by status', () => {
    store.filter.set('Failed');
    const filtered = store.filteredJobs();

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('Failed');
  });
});
