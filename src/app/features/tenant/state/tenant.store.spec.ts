import { TestBed } from '@angular/core/testing';
import { TenantStore } from './tenant.store';

describe('TenantStore', () => {
  let store: TenantStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantStore);
  });

  it('initializes with default values', () => {
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.activeSection()).toBe('overview');
  });

  it('exposes computed vm with all signals', () => {
    const vm = store.vm();
    expect(vm).toEqual({ loading: false, error: null, activeSection: 'overview' });
  });

  it('setLoading updates loading signal', () => {
    store.setLoading(true);
    expect(store.loading()).toBe(true);
    expect(store.vm().loading).toBe(true);
  });

  it('setError updates error signal', () => {
    store.setError('error occurred');
    expect(store.error()).toBe('error occurred');
  });

  it('setError with null clears error', () => {
    store.setError('err');
    store.setError(null);
    expect(store.error()).toBeNull();
  });

  it('setActiveSection updates active section', () => {
    store.setActiveSection('rooms');
    expect(store.activeSection()).toBe('rooms');
    expect(store.vm().activeSection).toBe('rooms');
  });
});
