import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApiService } from './auth-api.service';
import { AuthIdentityService } from './auth-identity.service';
import { DashboardService } from '../services/dashboard.service';

const IMPERSONATION_STORAGE_KEY = 'beedu.auth.tenant-impersonation';

interface BackendTenantImpersonationStartResponse {
  tenantId: string;
  tenantName: string;
  allowed: boolean;
  sessionId?: string;
  expiresAt?: string;
}

export interface TenantImpersonationContext {
  activeWorkspace: 'TENANT';
  impersonatedTenantId: string;
  impersonatedTenantName: string;
  startedByRole: 'OWNER' | 'SUPER_ADMIN';
  returnUrl: string;
  startedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TenantImpersonationService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly authIdentityService = inject(AuthIdentityService);
  private readonly dashboardService = inject(DashboardService);

  private readonly contextState = signal<TenantImpersonationContext | null>(this.readStoredContext());
  private readonly pendingImpersonatedTenantId = signal<string | null>(null);

  readonly context = computed(() => this.contextState());
  readonly isActive = computed(() => this.resolveOwnerRole() !== null && this.contextState() !== null);
  readonly impersonatedTenantId = computed(() => this.pendingImpersonatedTenantId() ?? (this.isActive() ? this.contextState()?.impersonatedTenantId ?? null : null));
  readonly impersonatedTenantName = computed(() => this.contextState()?.impersonatedTenantName ?? null);

  constructor() {
    if (this.isActive()) {
      this.dashboardService.setRole('tenant', false);
    }
  }

  async start(tenantId: string, tenantName: string, returnUrl: string): Promise<TenantImpersonationContext> {
    const startedByRole = this.resolveOwnerRole();
    if (!startedByRole) {
      throw new Error('Only owner or super admin accounts can impersonate tenants.');
    }

    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.post<BackendTenantImpersonationStartResponse>(
        `${environment.apiBaseUrl}/owner/tenants/${tenantId}/support-session`,
        { reason: 'Owner support access from tenant details' },
      ),
    );

    if (!response.allowed) {
      throw new Error('Tenant impersonation was not allowed.');
    }

    const context: TenantImpersonationContext = {
      activeWorkspace: 'TENANT',
      impersonatedTenantId: response.tenantId,
      impersonatedTenantName: response.tenantName?.trim() || tenantName.trim() || 'Unknown tenant',
      startedByRole,
      returnUrl: returnUrl.trim() || '/owner/tenants',
      startedAt: new Date().toISOString(),
    };

    this.pendingImpersonatedTenantId.set(context.impersonatedTenantId);
    try {
      const me = await this.authApi.me();
      if (!me.impersonating || me.impersonatedTenantId !== context.impersonatedTenantId || !me.tenantAccess) {
        throw new Error('Tenant impersonation could not be confirmed.');
      }
    } catch (error) {
      this.pendingImpersonatedTenantId.set(null);
      this.clearStoredContext();
      throw this.toStartError(error);
    }
    this.pendingImpersonatedTenantId.set(null);
    this.contextState.set(context);
    this.persist(context);
    this.dashboardService.returnUrl.set(context.returnUrl);
    this.dashboardService.setRole('tenant', false);
    return context;
  }

  exit(): string {
    const returnUrl = this.contextState()?.returnUrl || '/owner/tenants';
    this.contextState.set(null);
    this.clearStoredContext();
    this.dashboardService.returnUrl.set(null);
    this.dashboardService.setRole('owner', false);
    return returnUrl;
  }

  clear(): void {
    this.pendingImpersonatedTenantId.set(null);
    this.contextState.set(null);
    this.clearStoredContext();
  }

  canAccessTenantWorkspace(): boolean {
    return this.isActive();
  }

  syncWorkspaceRole(): void {
    if (this.isActive()) {
      this.dashboardService.setRole('tenant', false);
      return;
    }

    const workspace = this.authIdentityService.currentWorkspace();
    if (workspace === 'owner' || workspace === 'tenant' || workspace === 'teacher' || workspace === 'student' || workspace === 'parent') {
      this.dashboardService.setRole(workspace, false);
    }
  }

  private resolveOwnerRole(): 'OWNER' | 'SUPER_ADMIN' | null {
    const primaryRole = (this.authIdentityService.primaryRole() ?? '').trim().toUpperCase();
    if (primaryRole === 'OWNER') {
      return 'OWNER';
    }
    if (primaryRole === 'SUPER_ADMIN' || primaryRole === 'SUPERUSER' || primaryRole === 'SUPER_USER' || primaryRole === 'PLATFORM_OWNER') {
      return 'SUPER_ADMIN';
    }
    return null;
  }

  private toStartError(error: unknown): Error {
    const maybeError = error as { status?: number; error?: { message?: string }; message?: string };
    const backendMessage = maybeError.error?.message?.trim();
    if (backendMessage) {
      return new Error(backendMessage);
    }
    if (maybeError.status === 0) {
      return new Error('Tenant impersonation could not be confirmed. Check API connectivity or CORS configuration.');
    }
    if (maybeError.status === 401 || maybeError.status === 403) {
      return new Error('You are not authorized to impersonate this tenant.');
    }
    return new Error(maybeError.message || 'Tenant impersonation could not be started.');
  }

  private persist(context: TenantImpersonationContext): void {
    try {
      localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(context));
    } catch {
      return;
    }
  }

  private readStoredContext(): TenantImpersonationContext | null {
    try {
      const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<TenantImpersonationContext>;
      if (
        parsed.activeWorkspace !== 'TENANT'
        || typeof parsed.impersonatedTenantId !== 'string'
        || typeof parsed.impersonatedTenantName !== 'string'
        || typeof parsed.startedByRole !== 'string'
        || typeof parsed.returnUrl !== 'string'
        || typeof parsed.startedAt !== 'string'
      ) {
        return null;
      }

      if (parsed.startedByRole !== 'OWNER' && parsed.startedByRole !== 'SUPER_ADMIN') {
        return null;
      }

      return {
        activeWorkspace: 'TENANT',
        impersonatedTenantId: parsed.impersonatedTenantId,
        impersonatedTenantName: parsed.impersonatedTenantName,
        startedByRole: parsed.startedByRole,
        returnUrl: parsed.returnUrl,
        startedAt: parsed.startedAt,
      };
    } catch {
      return null;
    }
  }

  private clearStoredContext(): void {
    try {
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    } catch {
      return;
    }
  }
}
