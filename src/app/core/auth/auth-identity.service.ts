import { Injectable, computed, signal } from '@angular/core';

export interface AuthIdentity {
  username: string;
  roles: string[];
  primaryRole: string;
  tenantId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthIdentityService {
  private readonly identityState = signal<AuthIdentity | null>(null);

  readonly identity = computed(() => this.identityState());
  readonly username = computed(() => this.identityState()?.username ?? null);
  readonly primaryRole = computed(() => this.identityState()?.primaryRole ?? null);

  setIdentity(identity: AuthIdentity): void {
    this.identityState.set(identity);
  }

  clearIdentity(): void {
    this.identityState.set(null);
  }

  currentWorkspace(): 'owner' | 'tenant' | 'teacher' | null {
    const role = this.identityState()?.primaryRole;
    if (!role) {
      return null;
    }

    if (role === 'SUPER_ADMIN' || role === 'OWNER') {
      return 'owner';
    }
    if (role === 'TENANT_ADMIN') {
      return 'tenant';
    }
    if (role === 'TEACHER') {
      return 'teacher';
    }
    return null;
  }
}
