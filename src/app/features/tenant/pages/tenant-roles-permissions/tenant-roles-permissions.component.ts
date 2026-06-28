import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import { TenantAccessManagementFacade } from '../../state/tenant-access-management.facade';
import type { TenantRoleSummary } from '../../models/tenant-access-management.models';

@Component({
  selector: 'app-tenant-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './tenant-roles-permissions.component.html',
  styleUrl: './tenant-roles-permissions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantRolesPermissionsComponent {
  protected readonly facade = inject(TenantAccessManagementFacade);
  private readonly permissions = inject(TenantPermissionService);
  protected readonly roles = this.facade.roles;
  protected readonly loading = this.facade.loading;
  protected readonly error = this.facade.error;
  protected readonly searchQuery = this.facade.searchQuery;
  protected readonly statusFilter = this.facade.statusFilter;
  protected readonly canManageRoles = computed(() => this.permissions.hasPermission('tenant.roles.manage'));
  protected readonly confirmingDelete = signal<TenantRoleSummary | null>(null);
  protected readonly hasActiveFilters = computed(() => Boolean(this.searchQuery().trim()) || this.statusFilter() !== 'ALL');
  protected readonly emptyTitle = computed(() => this.hasActiveFilters() ? 'No roles match these filters.' : 'No roles created yet.');
  protected readonly emptyDescription = computed(() => this.hasActiveFilters()
    ? 'Adjust the search text or status filter to see more roles.'
    : 'Create a role to grant dashboard permissions to tenant users.',
  );

  constructor() {
    void this.facade.load();
  }

  async toggleStatus(role: TenantRoleSummary): Promise<void> {
    await this.facade.updateStatus(role.id, role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
  }

  askDelete(role: TenantRoleSummary): void {
    this.confirmingDelete.set(role);
  }

  async confirmDelete(): Promise<void> {
    const role = this.confirmingDelete();
    if (!role) {
      return;
    }
    await this.facade.deleteRole(role.id);
    this.confirmingDelete.set(null);
  }
}
