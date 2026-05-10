import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerProvisioningListStore } from './owner-provisioning-list.store';

describe('OwnerProvisioningListStore', () => {
  let store: OwnerProvisioningListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerProvisioningListStore);
  });

  it('exposes filter signal and filteredJobs computed', () => {
    expect(store.filter()).toBe('All');
    expect(Array.isArray(store.filteredJobs())).toBe(true);
  });

  it('reactively filters when filter signal changes', () => {
    store.filter.set('Failed');
    const filtered = store.filteredJobs();
    expect(filtered.every((job) => job.status === 'Failed')).toBe(true);
  });
});
