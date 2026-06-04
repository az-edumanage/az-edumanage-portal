import { Injectable, computed, signal } from '@angular/core';

import type { TenantPlanContext } from './auth-api.service';

export interface AuthIdentity {
  username: string;
  roles: string[];
  primaryRole: string;
  workspace: 'owner' | 'tenant' | 'teacher';
  tenantId: string | null;
  tenantPlan: TenantPlanContext | null;
  passwordChangeRequired: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthIdentityService {
  private readonly identityState = signal<AuthIdentity | null>(null);

  readonly identity = computed(() => this.identityState());
  readonly username = computed(() => this.identityState()?.username ?? null);
  readonly primaryRole = computed(() => this.identityState()?.primaryRole ?? null);
  readonly workspace = computed(() => this.identityState()?.workspace ?? null);

  setIdentity(identity: AuthIdentity): void {
    this.identityState.set(identity);
  }

  clearIdentity(): void {
    this.identityState.set(null);
  }

  currentWorkspace(): 'owner' | 'tenant' | 'teacher' | null {
    const identity = this.identityState();
    if (!identity) {
      return null;
    }

    if (identity.workspace === 'tenant') {
      return identity.tenantId ? 'tenant' : null;
    }

    if (identity.workspace === 'owner' || identity.workspace === 'teacher') {
      return identity.workspace;
    }

    const role = identity.primaryRole.trim().toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'OWNER') {
      return 'owner';
    }
    if (role === 'TENANT_ADMIN' || (role === 'WEB_USER' && identity.tenantId)) {
      return 'tenant';
    }
    if (role === 'TEACHER') {
      return 'teacher';
    }
    return null;
  }
}
