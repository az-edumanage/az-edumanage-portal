import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantUsersDataService } from '../data-access/tenant-users-data.service';

@Injectable({ providedIn: 'root' })
export class TenantUsersStore {
  private readonly data = inject(TenantUsersDataService);

  readonly activeTab = signal<'users' | 'pending'>('users');
  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);

  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortBy = signal('name');

  readonly users = this.data.users;
  readonly pendingRequests = this.data.pendingRequests;

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.roleFilter()) count++;
    if (this.statusFilter()) count++;
    if (this.sortBy() !== 'name') count++;
    return count;
  });

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();
    const sortBy = this.sortBy();

    const filtered = this.users().filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = !role || user.role === role;
      const matchesStatus = !status || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });

    if (sortBy === 'lastLogin') {
      filtered.sort((a, b) => a.lastLogin.localeCompare(b.lastLogin));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  async load(): Promise<void> {
    await this.data.loadUsers({
      search: this.searchQuery(),
      status: this.statusFilter(),
    });
  }
}
