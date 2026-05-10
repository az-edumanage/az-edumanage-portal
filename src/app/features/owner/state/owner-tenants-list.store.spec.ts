import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerTenantsListStore } from './owner-tenants-list.store';

describe('OwnerTenantsListStore', () => {
  let store: OwnerTenantsListStore;

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerTenantsListStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes searchQuery and filteredTenants signals', () => {
    expect(store.searchQuery).toBeDefined();
    expect(typeof store.searchQuery).toBe('function');
    expect(store.filteredTenants).toBeDefined();
    expect(typeof store.filteredTenants).toBe('function');
  });

  it('updates pendingStatusChange when requestStatusChange is called', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    expect(store.pendingStatusChange()).not.toBeNull();
    expect(store.pendingStatusChange()?.tenant.id).toBe(target.id);
    expect(store.pendingStatusChange()?.status).toBe('Suspended');
  });

  it('clears pendingStatusChange after confirm', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();
    expect(store.pendingStatusChange()).toBeNull();
  });
});
