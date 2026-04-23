import { TestBed } from '@angular/core/testing';
import { TenantUsersStore } from './tenant-users.store';

describe('TenantUsersStore', () => {
  let store: TenantUsersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantUsersStore);
  });

  it('filters users by role and search query', () => {
    store.roleFilter.set('Teacher');
    store.searchQuery.set('Ahmed');

    const filtered = store.filteredUsers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].role).toBe('Teacher');
    expect(filtered[0].name).toContain('Ahmed');
  });

  it('tracks active filter count', () => {
    expect(store.activeFiltersCount()).toBe(0);
    store.roleFilter.set('Admin');
    store.statusFilter.set('Active');
    store.sortBy.set('lastLogin');

    expect(store.activeFiltersCount()).toBe(3);
  });
});
