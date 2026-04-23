import { TenantGradeCreateStore } from './tenant-grade-create.store';

describe('TenantGradeCreateStore', () => {
  it('tracks submit state', () => {
    const store = new TenantGradeCreateStore();

    expect(store.isSubmitting()).toBeFalsy();
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBeTruthy();
  });
});
