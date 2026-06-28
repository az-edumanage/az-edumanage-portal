import { Injectable, inject } from '@angular/core';

import { TenantAccessManagementStore } from './tenant-access-management.store';
import type { TenantRoleStatus, TenantRoleWriteRequest } from '../models/tenant-access-management.models';

@Injectable({ providedIn: 'root' })
export class TenantAccessManagementFacade {
  private readonly store = inject(TenantAccessManagementStore);

  readonly permissionGroups = this.store.permissionGroups;
  readonly roles = this.store.filteredRoles;
  readonly selectedRole = this.store.selectedRole;
  readonly searchQuery = this.store.searchQuery;
  readonly statusFilter = this.store.statusFilter;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;

  load(): Promise<void> {
    return this.store.load();
  }

  selectRole(roleId: string): Promise<void> {
    return this.store.selectRole(roleId);
  }

  clearSelection(): void {
    this.store.clearSelection();
  }

  saveRole(payload: TenantRoleWriteRequest, roleId?: string | null) {
    return this.store.saveRole(payload, roleId);
  }

  updateStatus(roleId: string, status: TenantRoleStatus): Promise<void> {
    return this.store.updateStatus(roleId, status);
  }

  deleteRole(roleId: string): Promise<void> {
    return this.store.deleteRole(roleId);
  }
}
