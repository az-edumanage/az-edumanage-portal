import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerPlansListStore } from './owner-plans-list.store';

describe('OwnerPlansListStore', () => {
  let store: OwnerPlansListStore;

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerPlansListStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes plans signal from data service', () => {
    expect(store.plans).toBeDefined();
    expect(typeof store.plans).toBe('function');
  });
});
