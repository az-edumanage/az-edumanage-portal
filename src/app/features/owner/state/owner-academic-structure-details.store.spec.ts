import { TestBed } from '@angular/core/testing';
import { OwnerAcademicStructureDetailsStore } from './owner-academic-structure-details.store';

describe('OwnerAcademicStructureDetailsStore', () => {
  let store: OwnerAcademicStructureDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerAcademicStructureDetailsStore);
  });

  it('returns configured tabs/features/limits', () => {
    expect(store.tabs.length).toBe(6);
    expect(store.features().length).toBeGreaterThan(5);
    expect(store.limits().length).toBe(4);
  });
});
