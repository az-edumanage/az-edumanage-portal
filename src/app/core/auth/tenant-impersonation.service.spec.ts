// @vitest-environment jsdom
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { TenantImpersonationService } from './tenant-impersonation.service';
import { AuthApiService } from './auth-api.service';
import { AuthIdentityService } from './auth-identity.service';
import { DashboardService } from '../services/dashboard.service';
import { environment } from '../../../environments/environment';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('TenantImpersonationService', () => {
  let service: TenantImpersonationService;
  let httpTestingController: HttpTestingController;
  let authApi: { ensureLoggedIn: ReturnType<typeof vi.fn>; me: ReturnType<typeof vi.fn> };
  let authIdentity: { primaryRole: ReturnType<typeof signal>; currentWorkspace: ReturnType<typeof vi.fn> };
  let dashboardService: {
    returnUrl: ReturnType<typeof signal>;
    setRole: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();

    authApi = {
      ensureLoggedIn: vi.fn().mockResolvedValue('token'),
      me: vi.fn().mockResolvedValue({
        username: 'admin',
        roles: ['OWNER'],
        primaryRole: 'OWNER',
        workspace: 'owner',
        tenantId: 'tenant-1',
        tenantAccess: {
          tenantId: 'tenant-1',
          subscriptionState: 'production',
          tenantOperationalStatus: 'active',
          ownerDisplayStatus: 'active',
          accessMessage: null,
          operationalStatusReason: null,
        },
        tenantPlan: null,
      passwordChangeRequired: false,
        impersonating: true,
        impersonatedTenantId: 'tenant-1',
        impersonatedTenantName: 'Bright Center',
      }),
    };
    authIdentity = {
      primaryRole: signal<string | null>('OWNER'),
      currentWorkspace: vi.fn().mockReturnValue('owner'),
    };
    dashboardService = {
      returnUrl: signal<string | null>(null),
      setRole: vi.fn(),
    };
    router = {
      navigateByUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApi },
        { provide: AuthIdentityService, useValue: authIdentity },
        { provide: DashboardService, useValue: dashboardService },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(TenantImpersonationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('starts impersonation through the owner endpoint and persists context', async () => {
    const promise = service.start('tenant-1', 'Bright Center', '/owner/tenants');
    await Promise.resolve();

    const request = httpTestingController.expectOne(
      `${environment.apiBaseUrl}/owner/tenants/tenant-1/impersonation/start`,
    );
    expect(request.request.method).toBe('POST');
    request.flush({
      tenantId: 'tenant-1',
      tenantName: 'Bright Center',
      allowed: true,
    });

    const context = await promise;
    expect(context.impersonatedTenantId).toBe('tenant-1');
    expect(service.isActive()).toBe(true);
    expect(service.impersonatedTenantName()).toBe('Bright Center');
    expect(authApi.me).toHaveBeenCalled();
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant', false);
    expect(JSON.parse(localStorage.getItem('beedu.auth.tenant-impersonation') ?? '{}').impersonatedTenantId)
      .toBe('tenant-1');
  });

  it('does not persist impersonation when the backend current-user check fails', async () => {
    authApi.me.mockRejectedValueOnce({ status: 0 });

    const promise = service.start('tenant-1', 'Bright Center', '/owner/tenants');
    await Promise.resolve();

    const request = httpTestingController.expectOne(
      `${environment.apiBaseUrl}/owner/tenants/tenant-1/impersonation/start`,
    );
    request.flush({
      tenantId: 'tenant-1',
      tenantName: 'Bright Center',
      allowed: true,
    });

    await expect(promise).rejects.toThrow('Tenant impersonation could not be confirmed');
    expect(service.isActive()).toBe(false);
    expect(localStorage.getItem('beedu.auth.tenant-impersonation')).toBeNull();
  });

  it('clears impersonation and restores owner workspace state on exit', () => {
    service['contextState'].set({
      activeWorkspace: 'TENANT',
      impersonatedTenantId: 'tenant-1',
      impersonatedTenantName: 'Bright Center',
      startedByRole: 'OWNER',
      returnUrl: '/owner/tenants',
      startedAt: '2026-05-25T10:00:00Z',
    });
    localStorage.setItem('beedu.auth.tenant-impersonation', JSON.stringify(service.context()));

    const returnUrl = service.exit();

    expect(returnUrl).toBe('/owner/tenants');
    expect(service.isActive()).toBe(false);
    expect(dashboardService.setRole).toHaveBeenCalledWith('owner', false);
    expect(localStorage.getItem('beedu.auth.tenant-impersonation')).toBeNull();
  });

  it('keeps stored impersonation inactive for real tenant identities', () => {
    service['contextState'].set({
      activeWorkspace: 'TENANT',
      impersonatedTenantId: 'tenant-1',
      impersonatedTenantName: 'Bright Center',
      startedByRole: 'OWNER',
      returnUrl: '/owner/tenants',
      startedAt: '2026-05-25T10:00:00Z',
    });
    authIdentity.primaryRole.set('WEB_USER');
    authIdentity.currentWorkspace.mockReturnValue('tenant');

    expect(service.isActive()).toBe(false);
    expect(service.canAccessTenantWorkspace()).toBe(false);
    expect(service.impersonatedTenantId()).toBeNull();
  });
});
