import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerUsersListStore } from './owner-users-list.store';

describe('OwnerUsersListStore', () => {
  let store: OwnerUsersListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerUsersListStore);
  });

  it('exposes filter signal defaulting to All', () => {
    expect(store.filter()).toBe('All');
    expect(Array.isArray(store.filteredUsers())).toBe(true);
  });

  it('filters by selected platform role', () => {
    store.filter.set('Support Agent');
    const filtered = store.filteredUsers();

    expect(filtered.every((user) => user.role === 'Support Agent')).toBe(true);
  });
});
