import { TestBed } from '@angular/core/testing';
import { OwnerTenantCreateStore } from './owner-tenant-create.store';

describe('OwnerTenantCreateStore', () => {
  let store: OwnerTenantCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerTenantCreateStore);
  });

  it('should initialize with closed dropdowns and not submitting', () => {
    expect(store.isSubmitting()).toBe(false);
    expect(store.showTenantTypeDropdown()).toBe(false);
    expect(store.showCustomizationMenu()).toBe(false);
  });

  it('should update submitting state', () => {
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBe(true);
  });
});
