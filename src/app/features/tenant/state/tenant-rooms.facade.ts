import { Injectable, inject } from '@angular/core';
import { TenantRoomsStore } from './tenant-rooms.store';
import { Room } from '../models/tenant-rooms.models';

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
  readonly pagedRooms = this.store.pagedRooms;
  readonly totalFilteredRooms = this.store.totalFilteredRooms;
  readonly totalPages = this.store.totalPages;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly deleteState = this.store.deleteState;

  loadRooms(): void {
    void this.store.loadRooms();
  }

  setFilters(type: string, status: string, sortBy: string): void {
    this.typeFilter.set(type);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
    this.store.resetPage();
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.store.resetPage();
  }

  nextPage(): void {
    this.store.setPageIndex(this.pageIndex() + 1);
  }

  previousPage(): void {
    this.store.setPageIndex(this.pageIndex() - 1);
  }

  setPageSize(value: number): void {
    this.store.setPageSize(value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }

  requestDelete(room: Room): void {
    this.store.requestDelete(room);
  }

  closeDeleteModal(): void {
    this.store.closeDeleteModal();
  }

  confirmDelete(): Promise<void> {
    return this.store.confirmDelete();
  }
}
