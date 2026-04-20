import { OwnerNotificationFormStore } from './owner-notification-form.store';

describe('OwnerNotificationFormStore', () => {
  it('exposes stable task id', () => {
    const store = new OwnerNotificationFormStore();

    expect(store.taskId()).toBe('create-notification-task');
  });
});
