import { TestBed } from '@angular/core/testing';
import { OwnerUsersListStore } from './owner-users-list.store';

describe('OwnerUsersListStore', () => {
  let store: OwnerUsersListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerUsersListStore);
  });

  it('returns all users by default', () => {
    expect(store.filter()).toBe('All');
    expect(store.filteredUsers().length).toBe(4);
  });

  it('filters by selected platform role', () => {
    store.filter.set('Support Agent');
    const filtered = store.filteredUsers();

    expect(filtered.length).toBe(1);
    expect(filtered[0].role).toBe('Support Agent');
  });
});
