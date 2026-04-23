import { TestBed } from '@angular/core/testing';
import { OwnerPlanCreateStore } from './owner-plan-create.store';

describe('OwnerPlanCreateStore', () => {
  let store: OwnerPlanCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerPlanCreateStore);
  });

  it('should initialize in create mode with default task id', () => {
    expect(store.isEditMode()).toBe(false);
    expect(store.effectiveTaskId()).toBe('create-plan-task');
  });

  it('should switch to edit mode when plan id is set', () => {
    store.setPlanId('pln_pro');

    expect(store.isEditMode()).toBe(true);
    expect(store.planId()).toBe('pln_pro');
    expect(store.effectiveTaskId()).toBe('edit-plan-pln_pro');
  });
});
