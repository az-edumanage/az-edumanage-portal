import { TestBed } from '@angular/core/testing';
import { TenantGroupCreateStore } from './tenant-group-create.store';

describe('TenantGroupCreateStore', () => {
  let store: TenantGroupCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupCreateStore);
  });

  it('should initialize in create mode', () => {
    expect(store.groupId()).toBeNull();
    expect(store.isEditMode()).toBe(false);
  });

  it('should close other dropdowns when one is active', () => {
    store.setOwnedByDropdownOpen(true);
    store.setTeacherDropdownOpen(true);
    store.setGradeDropdownOpen(true);

    store.closeAllDropdownsExcept('teacher');

    expect(store.showTeacherDropdown()).toBe(true);
    expect(store.showOwnedByDropdown()).toBe(false);
    expect(store.showGradeDropdown()).toBe(false);
  });
});
