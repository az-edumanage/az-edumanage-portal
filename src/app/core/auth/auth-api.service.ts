import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';
import { AuthIdentityService } from './auth-identity.service';
import type { AuthIdentity } from './auth-identity.service';

export type AuthWorkspace = 'owner' | 'tenant' | 'teacher';

export interface TenantPlanContext {
  tenantId: string;
  planId: string;
  planName: string;
  isTrial: boolean;
  subscriptionType: 'trial' | 'production';
  moduleCodes: string[];
}

export interface LoginResponse {
  accessToken: string;
  username: string;
  roles?: string[];
  primaryRole?: string;
  workspace?: AuthWorkspace;
  tenantId?: string | null;
  tenantPlan?: TenantPlanContext | null;
  passwordChangeRequired?: boolean;
}

export interface MeResponse {
  username: string;
  roles: string[];
  primaryRole: string;
  workspace?: AuthWorkspace;
  tenantId: string | null;
  tenantAccess: TenantAccessContext | null;
  tenantPlan: TenantPlanContext | null;
  originalUsername?: string | null;
  impersonating?: boolean;
  impersonatedTenantId?: string | null;
  impersonatedTenantName?: string | null;
  passwordChangeRequired?: boolean;
}

export interface TenantAccessContext {
  tenantId: string;
  subscriptionState: string;
  tenantOperationalStatus: string;
  ownerDisplayStatus: string;
  accessMessage: string | null;
  operationalStatusReason: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(AuthTokenService);
  private readonly identityService = inject(AuthIdentityService);

  async login(username: string, password: string, workspace: AuthWorkspace): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, {
        username,
        password,
        workspace,
      }, { withCredentials: true }),
    );

    this.tokenService.setToken(response.accessToken);
    this.identityService.setIdentity(this.toIdentity(response));
    return response;
  }

  async ensureLoggedIn(): Promise<string> {
    const currentToken = this.tokenService.getToken();
    if (currentToken) {
      return currentToken;
    }
    throw new Error('Not authenticated');
  }

  async me(): Promise<MeResponse> {
    const response = await firstValueFrom(this.http.get<MeResponse>(`${environment.apiBaseUrl}/auth/me`));
    this.identityService.setIdentity(this.toIdentity(response));
    return response;
  }

  async changeInitialPassword(newPassword: string, confirmPassword: string): Promise<{ passwordChangeRequired: boolean }> {
    const response = await firstValueFrom(
      this.http.post<{ passwordChangeRequired: boolean }>(`${environment.apiBaseUrl}/auth/initial-password/change`, {
        newPassword,
        confirmPassword,
      }),
    );
    return response;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true }));
    } catch {
      // Keep logout UX resilient; local state is still cleared by caller.
    }
  }

  async refresh(): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ accessToken: string }>(`${environment.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true }),
    );
    this.tokenService.setToken(response.accessToken);
    return response.accessToken;
  }

  private toIdentity(source: LoginResponse | MeResponse): AuthIdentity {
    const primaryRole = source.primaryRole ?? source.roles?.[0] ?? 'OWNER';

    return {
      username: source.username,
      roles: source.roles ?? [],
      primaryRole,
      workspace: source.workspace ?? this.inferWorkspace(primaryRole, source.tenantId ?? null),
      tenantId: source.tenantId ?? null,
      tenantPlan: source.tenantPlan ?? null,
      passwordChangeRequired: source.passwordChangeRequired ?? false,
    };
  }

  private inferWorkspace(primaryRole: string, tenantId: string | null): AuthWorkspace {
    const normalizedRole = primaryRole.trim().toUpperCase();

    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER') {
      return 'owner';
    }
    if (normalizedRole === 'TENANT_ADMIN' || (normalizedRole === 'WEB_USER' && tenantId)) {
      return 'tenant';
    }
    if (normalizedRole === 'TEACHER') {
      return 'teacher';
    }
    return 'owner';
  }
}
