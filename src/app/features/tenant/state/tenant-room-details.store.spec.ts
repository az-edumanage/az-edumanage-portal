import { TestBed } from '@angular/core/testing';
import { TenantRoomDetailsStore } from './tenant-room-details.store';

describe('TenantRoomDetailsStore', () => {
  let store: TenantRoomDetailsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantRoomDetailsStore);
  });

  it('loads room details and computes occupancy stats', () => {
    store.loadRoom('2');

    expect(store.room()?.name).toBe('Physics Lab');
    expect(store.schedule().length).toBe(5);
    expect(store.totalOccupiedHours()).toBeGreaterThan(0);
    expect(store.occupancyRate()).toBeGreaterThan(0);
  });
});
