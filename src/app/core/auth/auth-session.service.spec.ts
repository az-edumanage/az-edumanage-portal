import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { AuthApiService } from './auth-api.service';
import { AuthTokenService } from './auth-token.service';
import { AuthIdentityService } from './auth-identity.service';
import { DashboardService } from '../services/dashboard.service';
import { TenantImpersonationService } from './tenant-impersonation.service';

describe('AuthSessionService', () => {
  let dashboardService: {
    setRole: ReturnType<typeof vi.fn>;
    syncRoleFromUrl: ReturnType<typeof vi.fn>;
    resolveWorkspaceFromUrl: ReturnType<typeof vi.fn>;
    returnUrl: { set: ReturnType<typeof vi.fn> };
  };
  let identityService: { currentWorkspace: ReturnType<typeof vi.fn>; clearIdentity: ReturnType<typeof vi.fn> };

  function configure(url: string): AuthSessionService {
    dashboardService = {
      setRole: vi.fn(),
      syncRoleFromUrl: vi.fn(),
      resolveWorkspaceFromUrl: vi.fn((candidate: string) => candidate.startsWith('/tenant') ? 'tenant' : null),
      returnUrl: { set: vi.fn() },
    };
    identityService = {
      currentWorkspace: vi.fn().mockReturnValue('owner'),
      clearIdentity: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthApiService, useValue: { me: vi.fn().mockResolvedValue({}) } },
        { provide: AuthTokenService, useValue: { getToken: vi.fn().mockReturnValue('token'), clearToken: vi.fn() } },
        { provide: AuthIdentityService, useValue: identityService },
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: TenantImpersonationService,
          useValue: {
            clear: vi.fn(),
            canAccessTenantWorkspace: vi.fn().mockReturnValue(false),
            syncWorkspaceRole: vi.fn(),
          },
        },
        { provide: Router, useValue: { url, navigate: vi.fn().mockResolvedValue(true) } },
      ],
    });

    return TestBed.inject(AuthSessionService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('uses route workspace over identity workspace during hydration', async () => {
    const service = configure('/tenant/overview');

    await service.hydrateFromBackend();

    expect(dashboardService.resolveWorkspaceFromUrl).toHaveBeenCalledWith('/tenant/overview');
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant', false);
  });

  it('falls back to identity workspace when route workspace is unresolved', async () => {
    const service = configure('/forbidden');
    dashboardService.resolveWorkspaceFromUrl.mockReturnValue(null);

    await service.hydrateFromBackend();

    expect(dashboardService.setRole).toHaveBeenCalledWith('owner', false);
  });
});
