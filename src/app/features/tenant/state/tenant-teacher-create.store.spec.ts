import { TestBed } from '@angular/core/testing';
import { TenantTeacherCreateStore } from './tenant-teacher-create.store';

describe('TenantTeacherCreateStore', () => {
  let store: TenantTeacherCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantTeacherCreateStore);
  });

  it('should initialize in create mode', () => {
    expect(store.teacherId()).toBeNull();
    expect(store.isEditMode()).toBe(false);
  });

  it('should switch to edit mode when teacher id is set', () => {
    store.setTeacherId('teacher-1');

    expect(store.teacherId()).toBe('teacher-1');
    expect(store.isEditMode()).toBe(true);
  });
});
