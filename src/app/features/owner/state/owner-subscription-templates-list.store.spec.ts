import { TestBed } from '@angular/core/testing';
import { OwnerSubscriptionTemplatesListStore } from './owner-subscription-templates-list.store';

describe('OwnerSubscriptionTemplatesListStore', () => {
  let store: OwnerSubscriptionTemplatesListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerSubscriptionTemplatesListStore);
  });

  it('returns seeded templates list', () => {
    const templates = store.templates();

    expect(templates.length).toBe(3);
    expect(templates[0].id).toBe('TMP_001');
  });
});
