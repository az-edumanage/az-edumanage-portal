import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerModuleDetailsStore } from './owner-module-details.store';

describe('OwnerModuleDetailsStore', () => {
  let store: OwnerModuleDetailsStore;

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerModuleDetailsStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes module, features, and limits signals', () => {
    expect(store.module).toBeDefined();
    expect(typeof store.module).toBe('function');
    expect(store.features).toBeDefined();
    expect(typeof store.features).toBe('function');
    expect(store.limits).toBeDefined();
    expect(typeof store.limits).toBe('function');
    expect(typeof store.loadModuleData).toBe('function');
  });
});
