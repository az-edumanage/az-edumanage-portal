import { TestBed } from '@angular/core/testing';
import { TeacherStore } from './teacher.store';

describe('TeacherStore', () => {
  let store: TeacherStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TeacherStore);
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
    store.setActiveSection('schedule');
    expect(store.activeSection()).toBe('schedule');
    expect(store.vm().activeSection).toBe('schedule');
  });
});
