import { TestBed } from '@angular/core/testing';
import { OwnerOverviewStore } from './owner-overview.store';

describe('OwnerOverviewStore', () => {
  let store: OwnerOverviewStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerOverviewStore);
  });

  it('initializes with 30d time range', () => {
    expect(store.timeRange()).toBe('30d');
  });

  it('exposes overview collections from data-access layer', () => {
    expect(store.stats().length).toBeGreaterThan(0);
    expect(store.plans().length).toBeGreaterThan(0);
    expect(store.activities().length).toBeGreaterThan(0);
    expect(store.services().length).toBeGreaterThan(0);
    expect(store.regions().length).toBeGreaterThan(0);
  });
});
