import { TestBed } from '@angular/core/testing';
import { OwnerTenantEditStore } from './owner-tenant-edit.store';

describe('OwnerTenantEditStore', () => {
  let store: OwnerTenantEditStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerTenantEditStore);
  });

  it('should initialize with loading tenant name and not submitting', () => {
    expect(store.tenantName()).toBe('Loading...');
    expect(store.isSubmitting()).toBe(false);
  });

  it('should update tenant id and tenant name', () => {
    store.setTenantId('tenant-1');
    store.setTenantName('Academy A');

    expect(store.tenantId()).toBe('tenant-1');
    expect(store.tenantName()).toBe('Academy A');
  });
});
