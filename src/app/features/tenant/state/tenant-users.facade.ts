import { Injectable, inject } from '@angular/core';
import { TenantUsersStore } from './tenant-users.store';

@Injectable({ providedIn: 'root' })
export class TenantUsersFacade {
  private readonly store = inject(TenantUsersStore);

  readonly activeTab = this.store.activeTab;
  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;

  readonly roleFilter = this.store.roleFilter;
  readonly statusFilter = this.store.statusFilter;
  readonly sortBy = this.store.sortBy;

  readonly users = this.store.users;
  readonly pendingRequests = this.store.pendingRequests;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredUsers = this.store.filteredUsers;

  setFilters(role: string, status: string, sortBy: string): void {
    this.roleFilter.set(role);
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

  load(): Promise<void> {
    return this.store.load();
  }
}
