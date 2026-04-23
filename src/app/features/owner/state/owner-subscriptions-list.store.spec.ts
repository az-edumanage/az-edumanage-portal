import { TestBed } from '@angular/core/testing';
import { OwnerSubscriptionsListStore } from './owner-subscriptions-list.store';

describe('OwnerSubscriptionsListStore', () => {
  let store: OwnerSubscriptionsListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerSubscriptionsListStore);
  });

  it('returns seeded subscriptions list', () => {
    const subscriptions = store.subscriptions();

    expect(subscriptions.length).toBe(5);
    expect(subscriptions[0].planName).toBe('Enterprise');
  });
});
