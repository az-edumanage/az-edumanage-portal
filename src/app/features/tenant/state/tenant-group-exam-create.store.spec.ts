import { TestBed } from '@angular/core/testing';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

describe('TenantGroupExamCreateStore', () => {
  let store: TenantGroupExamCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupExamCreateStore);
  });

  it('should assign group id and task id together', () => {
    store.setGroupId('g-1');

    expect(store.groupId()).toBe('g-1');
    expect(store.taskId()).toBe('create-exam-group-g-1');
  });

  it('should update submitting state', () => {
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBe(true);
  });
});
