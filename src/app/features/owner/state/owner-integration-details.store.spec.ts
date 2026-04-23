import { OwnerIntegrationDetailsStore } from './owner-integration-details.store';

describe('OwnerIntegrationDetailsStore', () => {
  it('tracks health check state', () => {
    const store = new OwnerIntegrationDetailsStore();

    expect(store.isCheckingHealth()).toBeFalsy();
    store.setCheckingHealth(true);
    expect(store.isCheckingHealth()).toBeTruthy();
  });
});
