import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OwnerRolesDataService } from '../../data-access/owner-roles-data.service';

interface PermissionOption {
  key: string;
  label: string;
}

interface PermissionGroup {
  key: string;
  label: string;
  permissions: PermissionOption[];
}

@Component({
  selector: 'app-owner-role-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './owner-role-create.component.html',
  styleUrl: './owner-role-create.component.css',
})
export class OwnerRoleCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rolesService = inject(OwnerRolesDataService);

  readonly groups: PermissionGroup[] = [
    {
      key: 'tenants',
      label: 'Tenants',
      permissions: [
        { key: 'tenant.read', label: 'View tenants' },
        { key: 'tenant.create', label: 'Create tenant' },
        { key: 'tenant.update', label: 'Edit tenant' },
        { key: 'tenant.suspend', label: 'Suspend tenant' },
      ],
    },
    {
      key: 'billing',
      label: 'Billing',
      permissions: [
        { key: 'billing.invoice.read', label: 'View invoices' },
        { key: 'billing.payment.read', label: 'View payments' },
        { key: 'billing.refund.create', label: 'Create refund' },
        { key: 'billing.report.export', label: 'Export billing reports' },
      ],
    },
    {
      key: 'subscriptions',
      label: 'Plans & Subscriptions',
      permissions: [
        { key: 'plan.read', label: 'View plans' },
        { key: 'plan.write', label: 'Create/Edit plans' },
        { key: 'subscription.read', label: 'View subscriptions' },
        { key: 'subscription.write', label: 'Create/Change subscriptions' },
      ],
    },
    {
      key: 'administration',
      label: 'Administration',
      permissions: [
        { key: 'user.read', label: 'View users' },
        { key: 'user.write', label: 'Create/Edit users' },
        { key: 'security.read', label: 'View security settings' },
        { key: 'audit.read', label: 'View audit logs' },
      ],
    },
  ];

  readonly roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    permissions: this.buildPermissionsGroup(),
  });

  readonly selectedCount = computed(() => this.getSelectedPermissions().length);
  readonly roleId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => !!this.roleId());

  constructor() {
    const role = this.rolesService.getById(this.roleId());
    if (!role) {
      return;
    }

    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
    });

    for (const key of role.permissions) {
      const control = this.findPermissionControl(key);
      control?.setValue(true);
    }
  }

  private buildPermissionsGroup(): FormGroup {
    const groupControls: Record<string, FormGroup> = {};

    for (const section of this.groups) {
      const permissionControls: Record<string, FormControl<boolean>> = {};
      for (const permission of section.permissions) {
        permissionControls[permission.key] = this.fb.nonNullable.control(false);
      }
      groupControls[section.key] = this.fb.group(permissionControls);
    }

    return this.fb.group(groupControls);
  }

  isGroupFullySelected(group: PermissionGroup): boolean {
    const controls = this.getGroupControls(group.key);
    return group.permissions.every((permission) => controls[permission.key]?.value === true);
  }

  isGroupPartiallySelected(group: PermissionGroup): boolean {
    const controls = this.getGroupControls(group.key);
    const selected = group.permissions.filter((permission) => controls[permission.key]?.value === true).length;
    return selected > 0 && selected < group.permissions.length;
  }

  toggleGroup(group: PermissionGroup, checked: boolean): void {
    const controls = this.getGroupControls(group.key);
    for (const permission of group.permissions) {
      controls[permission.key]?.setValue(checked);
    }
  }

  toggleAll(checked: boolean): void {
    for (const group of this.groups) {
      this.toggleGroup(group, checked);
    }
  }

  allSelected(): boolean {
    return this.groups.every((group) => this.isGroupFullySelected(group));
  }

  onCancel(): void {
    this.router.navigate(['/owner/users/roles']);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.rolesService.upsert({
      id: this.roleId() ?? undefined,
      name: this.roleForm.controls.name.value ?? '',
      description: this.roleForm.controls.description.value ?? '',
      permissions: this.getSelectedPermissions(),
    });
    this.router.navigate(['/owner/users/roles']);
  }

  private getGroupControls(groupKey: string): Record<string, FormControl<boolean>> {
    const permissions = this.roleForm.controls.permissions.controls[groupKey] as FormGroup;
    return permissions.controls as Record<string, FormControl<boolean>>;
  }

  private getSelectedPermissions(): string[] {
    const selected: string[] = [];

    for (const group of this.groups) {
      const controls = this.getGroupControls(group.key);
      for (const permission of group.permissions) {
        if (controls[permission.key]?.value) {
          selected.push(permission.key);
        }
      }
    }

    return selected;
  }

  private findPermissionControl(permissionKey: string): FormControl<boolean> | null {
    for (const group of this.groups) {
      const controls = this.getGroupControls(group.key);
      if (controls[permissionKey]) {
        return controls[permissionKey];
      }
    }

    return null;
  }
}
