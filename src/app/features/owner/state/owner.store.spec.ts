import { TestBed } from '@angular/core/testing';
import { OwnerStore } from './owner.store';

describe('OwnerStore', () => {
  let store: OwnerStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerStore);
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
    store.setError('Something went wrong');
    expect(store.error()).toBe('Something went wrong');
    expect(store.vm().error).toBe('Something went wrong');
  });

  it('setError with null clears error', () => {
    store.setError('error');
    store.setError(null);
    expect(store.error()).toBeNull();
  });

  it('setActiveSection updates active section', () => {
    store.setActiveSection('tenants');
    expect(store.activeSection()).toBe('tenants');
    expect(store.vm().activeSection).toBe('tenants');
  });
});
