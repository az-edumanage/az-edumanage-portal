import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantRoomsDataService } from '../data-access/tenant-rooms-data.service';
import { Room, RoomDeleteState } from '../models/tenant-rooms.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomsStore {
  private readonly data = inject(TenantRoomsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('list');

  readonly typeFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly rooms = this.data.rooms;
  readonly deleteState = signal<RoomDeleteState>({
    status: 'closed',
    room: null,
    message: '',
  });

  async loadRooms(): Promise<void> {
    await this.data.loadRooms();
  }

  requestDelete(room: Room): void {
    if ((room.relatedGroupsCount ?? 0) > 0) {
      this.deleteState.set({
        status: 'failed',
        room,
        message: "Couldn't delete room because it is related with group",
      });
      return;
    }

    this.deleteState.set({
      status: 'confirming',
      room,
      message: '',
    });
  }

  closeDeleteModal(): void {
    this.deleteState.set({
      status: 'closed',
      room: null,
      message: '',
    });
  }

  async confirmDelete(): Promise<void> {
    const room = this.deleteState().room;
    if (!room) {
      return;
    }

    this.deleteState.set({
      status: 'deleting',
      room,
      message: 'Deleting room...',
    });

    try {
      await this.data.deleteRoom(room.id);
      this.deleteState.set({
        status: 'success',
        room,
        message: 'Room deleted successfully.',
      });
    } catch (error) {
      this.deleteState.set({
        status: 'failed',
        room,
        message: this.data.toUserMessage(error),
      });
    }
  }

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.typeFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredRooms = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const type = this.typeFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.rooms().filter((room) => {
      const matchesSearch =
        !query ||
        room.name.toLowerCase().includes(query) ||
        room.equipment.some((equipment) => equipment.toLowerCase().includes(query));

      const matchesType = !type || room.type === type;
      const matchesStatus = !status || room.status === status;

      return matchesSearch && matchesType && matchesStatus;
    });

    if (sortBy === 'capacity-desc') {
      filtered.sort((a, b) => b.capacity - a.capacity);
    } else if (sortBy === 'capacity-asc') {
      filtered.sort((a, b) => a.capacity - b.capacity);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  readonly totalFilteredRooms = computed(() => this.filteredRooms().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFilteredRooms() / this.pageSize())));
  readonly clampedPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
  readonly pagedRooms = computed(() => {
    const pageIndex = this.clampedPageIndex();
    const pageSize = this.pageSize();
    const start = pageIndex * pageSize;
    return this.filteredRooms().slice(start, start + pageSize);
  });
  readonly pageStart = computed(() => {
    if (this.totalFilteredRooms() === 0) {
      return 0;
    }
    return this.clampedPageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.clampedPageIndex() + 1) * this.pageSize(), this.totalFilteredRooms()));

  setPageIndex(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 0;
    this.pageIndex.set(Math.max(0, Math.min(next, this.totalPages() - 1)));
  }

  setPageSize(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 10;
    this.pageSize.set(Math.max(1, next));
    this.resetPage();
  }

  resetPage(): void {
    this.pageIndex.set(0);
  }

  clampPage(): void {
    this.setPageIndex(this.pageIndex());
  }
}
