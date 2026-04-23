import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerUsersDataService } from '../data-access/owner-users-data.service';
import { PlatformRole } from '../models/owner-users.models';

@Injectable({ providedIn: 'root' })
export class OwnerUsersListStore {
  private readonly data = inject(OwnerUsersDataService);

  readonly filter = signal<'All' | PlatformRole>('All');
  readonly users = this.data.users;

  readonly filteredUsers = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.users();
    }

    return this.users().filter((user) => user.role === currentFilter);
  });
}
