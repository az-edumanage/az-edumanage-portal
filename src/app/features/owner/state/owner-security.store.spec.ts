import { OwnerSecurityStore } from './owner-security.store';

describe('OwnerSecurityStore', () => {
  it('exposes stable task id', () => {
    const store = new OwnerSecurityStore();

    expect(store.taskId()).toBe('security-settings-task');
  });
});
