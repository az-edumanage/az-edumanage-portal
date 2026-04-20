import { TestBed } from '@angular/core/testing';
import { OwnerTenantsListStore } from './owner-tenants-list.store';

describe('OwnerTenantsListStore', () => {
  let store: OwnerTenantsListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerTenantsListStore);
  });

  it('filters tenants by search query', () => {
    store.searchQuery.set('bright');
    expect(store.filteredTenants().length).toBe(1);
    expect(store.filteredTenants()[0].name).toContain('Bright');
  });

  it('confirms status change through data-access update', () => {
    const target = store.filteredTenants()[0];
    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();

    const updated = store.filteredTenants().find((tenant) => tenant.id === target.id);
    expect(updated?.status).toBe('Suspended');
    expect(store.pendingStatusChange()).toBeNull();
  });
});
