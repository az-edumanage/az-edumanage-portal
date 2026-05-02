import { Injectable, inject } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { AuthTokenService } from './auth-token.service';
import { AuthIdentityService } from './auth-identity.service';
import { DashboardService, UserRole } from '../services/dashboard.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenService = inject(AuthTokenService);
  private readonly identityService = inject(AuthIdentityService);
  private readonly dashboardService = inject(DashboardService);

  async hydrateFromBackend(): Promise<void> {
    const token = this.tokenService.getToken();
    if (!token) {
      return;
    }

    try {
      const me = await this.authApi.me();
      this.identityService.setIdentity(me);
      this.dashboardService.setRole(this.mapRoleToWorkspace(me.primaryRole), false);
    } catch {
      this.tokenService.clearToken();
      this.identityService.clearIdentity();
    }
  }

  private mapRoleToWorkspace(role: string): UserRole {
    if (role === 'SUPER_ADMIN' || role === 'OWNER') {
      return 'owner';
    }
    if (role === 'TENANT_ADMIN') {
      return 'tenant';
    }
    if (role === 'TEACHER') {
      return 'teacher';
    }
    return 'owner';
  }
}
