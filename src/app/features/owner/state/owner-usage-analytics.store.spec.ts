import { TestBed } from '@angular/core/testing';
import { OwnerUsageAnalyticsStore } from './owner-usage-analytics.store';

describe('OwnerUsageAnalyticsStore', () => {
  let store: OwnerUsageAnalyticsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerUsageAnalyticsStore);
  });

  it('returns seeded module and tenant usage data', () => {
    expect(store.modules().length).toBe(5);
    expect(store.tenants().length).toBe(5);
  });
});
