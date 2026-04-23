import { TestBed } from '@angular/core/testing';
import { TenantRoomCreateStore } from './tenant-room-create.store';

describe('TenantRoomCreateStore', () => {
  let store: TenantRoomCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantRoomCreateStore);
  });

  it('should initialize in create mode', () => {
    expect(store.isEditMode()).toBe(false);
    expect(store.taskId()).toBe('create-room-task');
  });

  it('should switch task id when edit room id is provided', () => {
    store.setRoomId('2');

    expect(store.isEditMode()).toBe(true);
    expect(store.taskId()).toBe('edit-room-2');
  });
});
