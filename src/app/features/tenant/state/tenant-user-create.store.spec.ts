import { TenantUserCreateStore } from './tenant-user-create.store';

describe('TenantUserCreateStore', () => {
  it('tracks submit state', () => {
    const store = new TenantUserCreateStore();

    expect(store.isSubmitting()).toBeFalsy();
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBeTruthy();
  });
});
