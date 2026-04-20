import { TestBed } from '@angular/core/testing';
import { OwnerPlanDetailsStore } from './owner-plan-details.store';

describe('OwnerPlanDetailsStore', () => {
  let store: OwnerPlanDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerPlanDetailsStore);
  });

  it('loads plan name from id and exposes seeded collections', () => {
    store.setPlanId('pln_pro');

    expect(store.planName()).toBe('Professional');
    expect(store.subscriptions().length).toBe(5);
    expect(store.auditLogs().length).toBe(4);
    expect(store.offers().length).toBe(3);
  });
});
