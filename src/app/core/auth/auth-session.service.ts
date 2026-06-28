import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { AuthTokenService } from './auth-token.service';
import { AuthIdentityService } from './auth-identity.service';
import { DashboardService } from '../services/dashboard.service';
import { TenantImpersonationService } from './tenant-impersonation.service';
import { isJwtExpired, jwtExpiresAt, safeRedirect } from './auth-url.utils';
import type { UserRole } from '../services/dashboard.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenService = inject(AuthTokenService);
  private readonly identityService = inject(AuthIdentityService);
  private readonly dashboardService = inject(DashboardService);
  private readonly tenantImpersonationService = inject(TenantImpersonationService);
  private readonly router = inject(Router);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private handlingSessionExpiry = false;
  private refreshPromise: Promise<string | null> | null = null;

  async hydrateFromBackend(): Promise<void> {
    const token = this.tokenService.getToken();
    if (!token) {
      if (this.isExpiredLoginUrl(this.router.url)) {
        await this.refreshSession(this.router.url, false);
        return;
      }
      this.tenantImpersonationService.clear();
      this.dashboardService.syncRoleFromUrl(this.router.url);
      this.clearExpiryTimer();
      return;
    }

    if (isJwtExpired(token)) {
      await this.refreshSession(this.router.url);
      return;
    }

    this.scheduleExpiry(token);

    try {
      await this.syncIdentityFromBackend();
    } catch {
      this.clearLocalAuthState();
    }
  }

  scheduleExpiry(token: string | null = this.tokenService.getToken()): void {
    this.handlingSessionExpiry = false;
    this.clearExpiryTimer();
    const expiresAt = jwtExpiresAt(token);
    if (expiresAt === null) {
      return;
    }
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      void this.refreshSession(this.router.url);
      return;
    }
    this.expiryTimer = setTimeout(() => void this.refreshSession(this.router.url), delay);
  }

  isTokenExpired(token: string | null = this.tokenService.getToken()): boolean {
    return isJwtExpired(token);
  }

  async refreshSession(currentUrl: string | null = this.router.url, navigateToLoginOnFailure = true): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshSessionInternal(currentUrl, navigateToLoginOnFailure)
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  handleSessionExpired(currentUrl?: string | null): void {
    if (this.handlingSessionExpiry) {
      return;
    }
    this.handlingSessionExpiry = true;
    const role = this.roleForUrl(currentUrl ?? this.router.url);
    const redirect = safeRedirect(currentUrl ?? this.router.url);
    this.clearLocalAuthState();
    const queryParams: Record<string, string> = { expired: '1' };
    if (redirect && !redirect.startsWith(`/${role}/login`)) {
      queryParams['redirect'] = redirect;
    }
    void this.router.navigate([`/${role}/login`], { queryParams, replaceUrl: true });
  }

  clearLocalAuthState(): void {
    this.tokenService.clearToken();
    this.identityService.clearIdentity();
    this.tenantImpersonationService.clear();
    this.dashboardService.returnUrl.set(null);
    this.dashboardService.syncRoleFromUrl(this.router.url);
    this.clearExpiryTimer();
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private async refreshSessionInternal(currentUrl: string | null, navigateToLoginOnFailure: boolean): Promise<string | null> {
    try {
      const token = await this.authApi.refresh();
      this.handlingSessionExpiry = false;
      this.scheduleExpiry(token);
      await this.syncIdentityFromBackend();
      return token;
    } catch {
      if (navigateToLoginOnFailure) {
        this.handleSessionExpired(currentUrl);
      } else {
        this.clearLocalAuthState();
      }
      return null;
    }
  }

  private async syncIdentityFromBackend(): Promise<void> {
    await this.authApi.me();
    if (this.tenantImpersonationService.canAccessTenantWorkspace()) {
      this.tenantImpersonationService.syncWorkspaceRole();
      return;
    }

    const routeWorkspace = this.dashboardService.resolveWorkspaceFromUrl(this.router.url);
    const workspace = routeWorkspace ?? this.identityService.currentWorkspace();
    this.dashboardService.setRole(workspace, false);
  }

  private isExpiredLoginUrl(url: string): boolean {
    const [path, query = ''] = url.split('?');
    if (!path.endsWith('/login')) {
      return false;
    }
    return new URLSearchParams(query).get('expired') === '1';
  }

  private roleForUrl(url: string | null): UserRole {
    if (url?.startsWith('/tenant')) {
      return 'tenant';
    }
    if (url?.startsWith('/teacher')) {
      return 'teacher';
    }
    if (url?.startsWith('/student')) {
      return 'student';
    }
    if (url?.startsWith('/parent')) {
      return 'parent';
    }
    return 'owner';
  }
}
