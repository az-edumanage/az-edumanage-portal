import { TestBed } from '@angular/core/testing';
import { OwnerMonitoringStore } from './owner-monitoring.store';

describe('OwnerMonitoringStore', () => {
  let store: OwnerMonitoringStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerMonitoringStore);
  });

  it('returns seeded monitoring collections', () => {
    expect(store.alerts().length).toBe(3);
    expect(store.tenantHealth().length).toBe(4);
    expect(store.logs().length).toBe(5);
  });
});
