import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantAccessManagementDataService } from '../data-access/tenant-access-management-data.service';
import type {
  TenantPermissionGroup,
  TenantRoleDetail,
  TenantRoleStatus,
  TenantRoleSummary,
  TenantRoleWriteRequest,
} from '../models/tenant-access-management.models';

@Injectable({ providedIn: 'root' })
export class TenantAccessManagementStore {
  private readonly data = inject(TenantAccessManagementDataService);
  private readonly authApi = inject(AuthApiService);

  readonly permissionGroups = signal<TenantPermissionGroup[]>([]);
  readonly roles = signal<TenantRoleSummary[]>([]);
  readonly selectedRole = signal<TenantRoleDetail | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<TenantRoleStatus | 'ALL'>('ALL');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredRoles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.roles().filter((role) => {
      const matchesStatus = status === 'ALL' || role.status === status;
      const matchesSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        (role.description ?? '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [permissions, roles] = await Promise.all([
        firstValueFrom(this.data.listPermissionGroups()),
        firstValueFrom(this.data.listRoles({ status: this.statusFilter() })),
      ]);
      this.permissionGroups.set(permissions.groups);
      this.roles.set(roles.roles);
    } catch (error) {
      this.error.set(this.errorMessage(error, 'Unable to load roles and permissions.'));
    } finally {
      this.loading.set(false);
    }
  }

  async selectRole(roleId: string): Promise<void> {
    this.selectedRole.set(await firstValueFrom(this.data.getRole(roleId)));
  }

  clearSelection(): void {
    this.selectedRole.set(null);
  }

  async saveRole(payload: TenantRoleWriteRequest, roleId?: string | null): Promise<TenantRoleDetail | null> {
    const validation = this.validate(payload);
    if (validation) {
      this.error.set(validation);
      return null;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const saved = await firstValueFrom(
        roleId ? this.data.updateRole(roleId, payload) : this.data.createRole(payload),
      );
      await this.load();
      await this.refreshIdentity();
      this.selectedRole.set(saved);
      return saved;
    } catch (error) {
      this.error.set(this.errorMessage(error, 'Unable to save role.'));
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  async updateStatus(roleId: string, status: TenantRoleStatus): Promise<void> {
    await firstValueFrom(this.data.updateRoleStatus(roleId, status));
    await this.load();
    await this.refreshIdentity();
  }

  async deleteRole(roleId: string): Promise<void> {
    await firstValueFrom(this.data.deleteRole(roleId));
    await this.load();
    await this.refreshIdentity();
  }

  private async refreshIdentity(): Promise<void> {
    try {
      await this.authApi.me();
    } catch {
      // Keep role management usable even if identity refresh is interrupted.
    }
  }

  private validate(payload: TenantRoleWriteRequest): string | null {
    if (!payload.name.trim()) {
      return 'Role name is required.';
    }
    if (!payload.permissionKeys.length) {
      return 'Select at least one permission.';
    }
    return null;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const body = (error as { error?: { message?: string; error?: string } }).error;
      return body?.message ?? body?.error ?? fallback;
    }
    return fallback;
  }
}
