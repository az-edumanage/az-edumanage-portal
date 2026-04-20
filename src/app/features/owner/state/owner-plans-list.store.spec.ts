import { TestBed } from '@angular/core/testing';
import { OwnerPlansListStore } from './owner-plans-list.store';

describe('OwnerPlansListStore', () => {
  let store: OwnerPlansListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerPlansListStore);
  });

  it('returns seeded plans list', () => {
    const plans = store.plans();

    expect(plans.length).toBe(3);
    expect(plans[0].name).toBe('Starter');
  });
});
