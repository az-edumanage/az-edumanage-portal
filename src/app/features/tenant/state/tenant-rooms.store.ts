import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantRoomsDataService } from '../data-access/tenant-rooms-data.service';

@Injectable({ providedIn: 'root' })
export class TenantRoomsStore {
  private readonly data = inject(TenantRoomsDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly typeFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');

  readonly rooms = this.data.rooms;

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
}
