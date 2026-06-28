import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { TenantAccessManagementFacade } from '../../state/tenant-access-management.facade';
import type {
  TenantPermissionGroup,
  TenantRoleWriteRequest,
} from '../../models/tenant-access-management.models';

@Component({
  selector: 'app-tenant-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tenant-role-form.component.html',
  styleUrl: './tenant-role-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantRoleFormComponent {
  private readonly facade = inject(TenantAccessManagementFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly permissionGroups = this.facade.permissionGroups;
  protected readonly loading = this.facade.loading;
  protected readonly saving = this.facade.saving;
  protected readonly error = this.facade.error;
  protected readonly roleId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly submitted = signal(false);
  protected readonly initializing = signal(false);
  protected readonly form = signal({
    name: '',
    description: '',
    permissionKeys: [] as string[],
  });

  protected readonly isEdit = computed(() => Boolean(this.roleId()));
  protected readonly formTitle = computed(() => this.isEdit() ? 'Edit Role' : 'Create Role');
  protected readonly formSubtitle = computed(() => this.isEdit()
    ? 'Update role details and dashboard permissions.'
    : 'Create a dashboard role by selecting the permissions it can use.',
  );
  protected readonly submitLabel = computed(() => this.isEdit() ? 'Save Changes' : 'Create Role');
  protected readonly selectedPermissionCount = computed(() => this.form().permissionKeys.length);
  protected readonly showNameError = computed(() => this.submitted() && !this.form().name.trim());
  protected readonly showPermissionError = computed(() => this.submitted() && this.form().permissionKeys.length === 0);

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    this.initializing.set(true);
    await this.facade.load();
    const roleId = this.roleId();
    if (roleId) {
      await this.facade.selectRole(roleId);
      const role = this.facade.selectedRole();
      if (role) {
        this.form.set({
          name: role.name,
          description: role.description ?? '',
          permissionKeys: [...role.permissions],
        });
      }
    } else {
      this.facade.clearSelection();
      this.form.set({ name: '', description: '', permissionKeys: [] });
    }
    this.initializing.set(false);
  }

  updateName(name: string): void {
    this.form.update((form) => ({ ...form, name }));
  }

  updateDescription(description: string): void {
    this.form.update((form) => ({ ...form, description }));
  }

  togglePermission(permissionKey: string): void {
    this.form.update((form) => {
      const exists = form.permissionKeys.includes(permissionKey);
      return {
        ...form,
        permissionKeys: exists
          ? form.permissionKeys.filter((key) => key !== permissionKey)
          : [...form.permissionKeys, permissionKey],
      };
    });
  }

  hasSelected(permissionKey: string): boolean {
    return this.form().permissionKeys.includes(permissionKey);
  }

  groupSelectedCount(group: TenantPermissionGroup): number {
    const selected = new Set(this.form().permissionKeys);
    return group.permissions.filter((permission) => selected.has(permission.key)).length;
  }

  toggleGroup(group: TenantPermissionGroup): void {
    this.form.update((form) => {
      const selected = new Set(form.permissionKeys);
      const groupKeys = group.permissions.map((permission) => permission.key);
      const hasWholeGroup = groupKeys.every((key) => selected.has(key));

      for (const key of groupKeys) {
        if (hasWholeGroup) {
          selected.delete(key);
        } else {
          selected.add(key);
        }
      }

      return { ...form, permissionKeys: [...selected] };
    });
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (!this.form().name.trim() || this.form().permissionKeys.length === 0) {
      return;
    }

    const payload: TenantRoleWriteRequest = {
      name: this.form().name,
      description: this.form().description,
      permissionKeys: this.form().permissionKeys,
    };
    const saved = await this.facade.saveRole(payload, this.roleId());
    if (saved) {
      await this.router.navigate(['/tenant/users/roles-permissions']);
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/tenant/users/roles-permissions']);
  }
}
