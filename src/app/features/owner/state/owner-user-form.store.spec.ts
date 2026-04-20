import { OwnerUserFormStore } from './owner-user-form.store';

describe('OwnerUserFormStore', () => {
  it('switches to edit-mode task id when user id exists', () => {
    const store = new OwnerUserFormStore();

    store.setUserId('usr-7');

    expect(store.isEditMode()).toBeTruthy();
    expect(store.taskId()).toBe('edit-user-task-usr-7');
  });
});
