import { Injectable, computed, signal } from '@angular/core';

import type { TenantPlanContext, TenantRoleAssignmentContext } from './auth-api.service';
import type { TenantModuleCode } from './tenant-module-entitlements';

export interface AuthIdentity {
  username: string;
  roles: string[];
  primaryRole: string;
  workspace: 'owner' | 'tenant' | 'teacher' | 'student' | 'parent' | 'public';
  tenantId: string | null;
  tenantPlan: TenantPlanContext | null;
  permissions?: string[];
  roleAssignment?: TenantRoleAssignmentContext | null;
  passwordChangeRequired: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthIdentityService {
  private readonly identityState = signal<AuthIdentity | null>(null);

  readonly identity = computed(() => this.identityState());
  readonly username = computed(() => this.identityState()?.username ?? null);
  readonly primaryRole = computed(() => this.identityState()?.primaryRole ?? null);
  readonly workspace = computed(() => this.identityState()?.workspace ?? null);
  readonly permissions = computed(() => this.identityState()?.permissions ?? []);
  readonly roleAssignment = computed(() => this.identityState()?.roleAssignment ?? null);

  setIdentity(identity: AuthIdentity): void {
    this.identityState.set(identity);
  }

  clearIdentity(): void {
    this.identityState.set(null);
  }

  currentWorkspace(): 'owner' | 'tenant' | 'teacher' | 'student' | 'parent' | null {
    const identity = this.identityState();
    if (!identity) {
      return null;
    }

    if (identity.workspace === 'tenant') {
      return identity.tenantId ? 'tenant' : null;
    }

    if (identity.workspace === 'owner' || identity.workspace === 'teacher' || identity.workspace === 'student' || identity.workspace === 'parent') {
      return identity.workspace;
    }

    const role = identity.primaryRole.trim().toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'OWNER') {
      return 'owner';
    }
    if (role === 'TENANT_ADMIN' || (role === 'WEB_USER' && identity.tenantId)) {
      return 'tenant';
    }
    if (role === 'TEACHER') return 'teacher';
    if (role === 'STUDENT') return 'student';
    if (role === 'PARENT') return 'parent';
    return null;
  }

  hasPermission(permission: string): boolean {
    if (this.hasFullTenantAccess()) {
      return true;
    }
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasModule(moduleCode: TenantModuleCode | string): boolean {
    const normalizedCode = moduleCode.trim().toLowerCase();
    return this.identityState()?.tenantPlan?.moduleCodes
      ?.some((code) => code.trim().toLowerCase() === normalizedCode) ?? false;
  }

  hasAllModules(moduleCodes: readonly (TenantModuleCode | string)[]): boolean {
    return moduleCodes.every((moduleCode) => this.hasModule(moduleCode));
  }

  private hasFullTenantAccess(): boolean {
    const identity = this.identityState();
    if (!identity) {
      return false;
    }
    const roles = new Set([
      identity.primaryRole,
      ...identity.roles,
    ].map((role) => role.trim().toUpperCase()));
    return roles.has('SUPER_ADMIN') || roles.has('OWNER') || roles.has('TENANT_ADMIN');
  }
}
