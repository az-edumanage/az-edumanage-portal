import { TestBed } from '@angular/core/testing';
import { TenantStudentCreateStore } from './tenant-student-create.store';

describe('TenantStudentCreateStore', () => {
  let store: TenantStudentCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantStudentCreateStore);
  });

  it('should initialize with submitting false', () => {
    expect(store.isSubmitting()).toBe(false);
  });

  it('should update submitting state', () => {
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBe(true);
  });
});
