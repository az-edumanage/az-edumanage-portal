import { TestBed } from '@angular/core/testing';
import { OwnerNotificationsListStore } from './owner-notifications-list.store';

describe('OwnerNotificationsListStore', () => {
  let store: OwnerNotificationsListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerNotificationsListStore);
  });

  it('returns seeded notifications list', () => {
    const notifications = store.notifications();

    expect(notifications.length).toBe(4);
    expect(notifications[0].type).toBe('Maintenance');
  });
});
