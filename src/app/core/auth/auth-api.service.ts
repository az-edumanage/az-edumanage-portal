import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';
import { AuthIdentityService, AuthIdentity } from './auth-identity.service';

interface LoginResponse {
  accessToken: string;
  username: string;
  roles?: string[];
  primaryRole?: string;
  tenantId?: string | null;
}

export interface MeResponse {
  username: string;
  roles: string[];
  primaryRole: string;
  tenantId: string | null;
  tenantAccess: TenantAccessContext | null;
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

  async login(username: string, password: string, workspace: 'owner' | 'tenant' | 'teacher'): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, {
        username,
        password,
        workspace,
      }, { withCredentials: true }),
    );

    this.tokenService.setToken(response.accessToken);
    this.identityService.setIdentity(this.toIdentity(response));
    return response.accessToken;
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
    return {
      username: source.username,
      roles: source.roles ?? [],
      primaryRole: source.primaryRole ?? source.roles?.[0] ?? 'OWNER',
      tenantId: source.tenantId ?? null,
    };
  }
}
