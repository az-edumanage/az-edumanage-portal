import { Injectable, inject } from '@angular/core';
import { TenantRoomsStore } from './tenant-rooms.store';

@Injectable({ providedIn: 'root' })
export class TenantRoomsFacade {
  private readonly store = inject(TenantRoomsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly typeFilter = this.store.typeFilter;
  readonly statusFilter = this.store.statusFilter;
  readonly sortBy = this.store.sortBy;

  readonly rooms = this.store.rooms;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredRooms = this.store.filteredRooms;

  setFilters(type: string, status: string, sortBy: string): void {
    this.typeFilter.set(type);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }
}
