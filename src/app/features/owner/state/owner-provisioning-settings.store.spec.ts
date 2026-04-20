import { OwnerProvisioningSettingsStore } from './owner-provisioning-settings.store';

describe('OwnerProvisioningSettingsStore', () => {
  it('exposes stable task id', () => {
    const store = new OwnerProvisioningSettingsStore();

    expect(store.taskId()).toBe('provisioning-settings-task');
  });
});
