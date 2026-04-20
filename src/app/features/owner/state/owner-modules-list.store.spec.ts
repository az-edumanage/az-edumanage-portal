import { TestBed } from '@angular/core/testing';
import { OwnerModulesListStore } from './owner-modules-list.store';

describe('OwnerModulesListStore', () => {
  let store: OwnerModulesListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerModulesListStore);
  });

  it('returns all modules by default', () => {
    expect(store.filter()).toBe('All');
    expect(store.filteredModules().length).toBe(12);
  });

  it('filters modules by selected category', () => {
    store.filter.set('Core System');
    const filtered = store.filteredModules();

    expect(filtered.length).toBe(2);
    expect(filtered.every((moduleItem) => moduleItem.category === 'Core System')).toBe(true);
  });
});
