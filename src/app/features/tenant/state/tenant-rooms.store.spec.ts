import { TestBed } from '@angular/core/testing';
import { TenantRoomsStore } from './tenant-rooms.store';

describe('TenantRoomsStore', () => {
  let store: TenantRoomsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantRoomsStore);
  });

  it('filters by room type and status', () => {
    store.typeFilter.set('Classroom');
    store.statusFilter.set('Available');

    const filtered = store.filteredRooms();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Room 101');
  });

  it('sorts by descending capacity', () => {
    store.sortBy.set('capacity-desc');
    const filtered = store.filteredRooms();
    expect(filtered[0].capacity).toBe(500);
  });
});
