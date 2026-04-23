import { TestBed } from '@angular/core/testing';
import { OwnerModuleDetailsStore } from './owner-module-details.store';

describe('OwnerModuleDetailsStore', () => {
  let store: OwnerModuleDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerModuleDetailsStore);
  });

  it('loads module presets based on route id', () => {
    store.loadModuleData('mod-users');

    expect(store.module().id).toBe('mod-users');
    expect(store.features().length).toBeGreaterThan(10);
    expect(store.limits().length).toBe(2);
  });
});
