import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerSubscriptionTemplatesListStore } from './owner-subscription-templates-list.store';

describe('OwnerSubscriptionTemplatesListStore', () => {
  let store: OwnerSubscriptionTemplatesListStore;

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerSubscriptionTemplatesListStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes templates signal from data service', () => {
    expect(store.templates).toBeDefined();
    expect(typeof store.templates).toBe('function');
  });
});
