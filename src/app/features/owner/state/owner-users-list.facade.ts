import { Injectable, inject } from '@angular/core';
import { OwnerUsersListStore } from './owner-users-list.store';
import { PlatformRole } from '../models/owner-users.models';

@Injectable({ providedIn: 'root' })
export class OwnerUsersListFacade {
  private readonly store = inject(OwnerUsersListStore);

  readonly filter = this.store.filter;
  readonly users = this.store.users;
  readonly filteredUsers = this.store.filteredUsers;

  setFilter(value: 'All' | PlatformRole): void {
    this.filter.set(value);
  }
}
