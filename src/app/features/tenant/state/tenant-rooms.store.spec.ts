import { TestBed } from '@angular/core/testing';
import { TenantRoomsDataService } from '../data-access/tenant-rooms-data.service';
import { Room } from '../models/tenant-rooms.models';
import { TenantRoomsStore } from './tenant-rooms.store';

describe('TenantRoomsStore', () => {
  let store: TenantRoomsStore;
  let dataService: {
    rooms: () => Room[];
    loadRooms: ReturnType<typeof vi.fn>;
    deleteRoom: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      rooms: () => [
        {
          id: '1',
          name: 'Room 101',
          type: 'Classroom',
          capacity: 30,
          status: 'Available',
          equipment: ['Projector', 'AC', 'Whiteboard'],
        },
        {
          id: '2',
          name: 'Physics Lab',
          type: 'Laboratory',
          capacity: 20,
          status: 'Occupied',
          equipment: ['Lab Kits', 'Projector', 'Safety Gear'],
          relatedGroupsCount: 2,
        },
        {
          id: '3',
          name: 'Virtual Room A',
          type: 'Virtual',
          capacity: 500,
          status: 'Available',
          equipment: ['Zoom Integration', 'Recording'],
        },
        {
          id: '4',
          name: 'Auditorium Main',
          type: 'Auditorium',
          capacity: 150,
          status: 'Maintenance',
          equipment: ['Stage', 'Speakers'],
        },
      ],
      loadRooms: vi.fn().mockResolvedValue(undefined),
      deleteRoom: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Delete failed'),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TenantRoomsDataService,
          useValue: dataService,
        },
      ],
    });
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

  it('uses list view by default', () => {
    expect(store.viewMode()).toBe('list');
  });

  it('paginates filtered rooms', () => {
    store.setPageSize(2);

    expect(store.totalFilteredRooms()).toBe(4);
    expect(store.totalPages()).toBe(2);
    expect(store.pageStart()).toBe(1);
    expect(store.pageEnd()).toBe(2);
    expect(store.pagedRooms().length).toBe(2);

    store.setPageIndex(1);

    expect(store.pageStart()).toBe(3);
    expect(store.pageEnd()).toBe(4);
    expect(store.pagedRooms().length).toBe(2);
  });

  it('opens delete confirmation for rooms not related with groups', () => {
    store.requestDelete(dataService.rooms()[0]);

    expect(store.deleteState().status).toBe('confirming');
    expect(store.deleteState().room?.name).toBe('Room 101');
  });

  it("shows a couldn't delete message for rooms related with groups", () => {
    store.requestDelete(dataService.rooms()[1]);

    expect(store.deleteState().status).toBe('failed');
    expect(store.deleteState().message).toBe("Couldn't delete room because it is related with group");
    expect(dataService.deleteRoom).not.toHaveBeenCalled();
  });

  it('deletes a confirmed room', async () => {
    store.requestDelete(dataService.rooms()[0]);
    await store.confirmDelete();

    expect(dataService.deleteRoom).toHaveBeenCalledWith('1');
    expect(store.deleteState().status).toBe('success');
  });
});
