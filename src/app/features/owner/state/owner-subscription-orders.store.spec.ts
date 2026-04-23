import { TestBed } from '@angular/core/testing';
import { OwnerSubscriptionOrdersStore } from './owner-subscription-orders.store';

describe('OwnerSubscriptionOrdersStore', () => {
  let store: OwnerSubscriptionOrdersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerSubscriptionOrdersStore);
  });

  it('should initialize export defaults', () => {
    expect(store.exportStep()).toBe(1);
    expect(store.exportFormat()).toBeNull();
    expect(store.exportMode()).toBe('all');
  });

  it('should expose status options', () => {
    expect(store.statuses).toEqual(['Pending', 'Approved', 'Paid', 'Rejected']);
  });
});
