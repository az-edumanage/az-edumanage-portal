import { OwnerTenantDetailsStore } from './owner-tenant-details.store';

describe('OwnerTenantDetailsStore', () => {
  it('tracks upgrade submitting state', () => {
    const store = new OwnerTenantDetailsStore();

    expect(store.isUpgrading()).toBeFalsy();
    store.setUpgrading(true);
    expect(store.isUpgrading()).toBeTruthy();
  });
});
