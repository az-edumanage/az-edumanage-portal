import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { passwordChangeRequiredGuard, roleGuard } from "./role.guard";
import { DashboardService } from "../services/dashboard.service";
import { AuthIdentity, AuthIdentityService } from "../auth/auth-identity.service";
import { TenantImpersonationService } from "../auth/tenant-impersonation.service";
import { AuthSessionService } from "../auth/auth-session.service";

const ownerIdentity: AuthIdentity = {
  username: "owner",
  roles: ["OWNER"],
  primaryRole: "OWNER",
  workspace: "owner",
  tenantId: null,
  tenantPlan: null,
  passwordChangeRequired: false,
};

const tenantIdentity: AuthIdentity = {
  username: "tenant-user",
  roles: ["WEB_USER"],
  primaryRole: "WEB_USER",
  workspace: "tenant",
  tenantId: "tenant-1",
  tenantPlan: null,
  passwordChangeRequired: false,
};

describe("roleGuard", () => {
  let router: Router;
  let dashboardService: {
    currentRole: ReturnType<typeof vi.fn>;
    setRole: ReturnType<typeof vi.fn>;
    resolveWorkspaceFromUrl: ReturnType<typeof vi.fn>;
  };
  let authIdentityService: {
    identity: ReturnType<typeof vi.fn>;
    currentWorkspace: ReturnType<typeof vi.fn>;
  };
  let tenantImpersonationService: {
    canAccessTenantWorkspace: ReturnType<typeof vi.fn>;
  };
  let authSessionService: {
    hydrateFromBackend: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dashboardService = {
      currentRole: vi.fn().mockReturnValue("owner"),
      setRole: vi.fn(),
      resolveWorkspaceFromUrl: vi.fn((url: string) => {
        const first = url.split('?')[0].split('/').filter(Boolean)[0];
        return first === 'owner' || first === 'tenant' || first === 'teacher' ? first : null;
      }),
    };
    authIdentityService = {
      identity: vi.fn().mockReturnValue(ownerIdentity),
      currentWorkspace: vi.fn().mockReturnValue("owner"),
    };
    tenantImpersonationService = {
      canAccessTenantWorkspace: vi.fn().mockReturnValue(false),
    };
    authSessionService = {
      hydrateFromBackend: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "forbidden", children: [] },
          { path: "owner/overview", children: [] },
          { path: "tenant/overview", children: [] },
          { path: "tenant/change-password", children: [] },
        ]),
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthIdentityService, useValue: authIdentityService },
        { provide: TenantImpersonationService, useValue: tenantImpersonationService },
        { provide: AuthSessionService, useValue: authSessionService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it("allows real tenant sessions with WEB_USER role and tenant scope into tenant routes", async () => {
    authIdentityService.identity.mockReturnValue(tenantIdentity);
    authIdentityService.currentWorkspace.mockReturnValue("tenant");

    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(result).toBe(true);
    expect(tenantImpersonationService.canAccessTenantWorkspace).not.toHaveBeenCalled();
  });

  it("hydrates backend identity before deciding tenant route access after refresh", async () => {
    authIdentityService.identity
      .mockReturnValueOnce(null)
      .mockReturnValue(tenantIdentity);
    authIdentityService.currentWorkspace.mockReturnValue("tenant");

    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(authSessionService.hydrateFromBackend).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it("denies tenant workspace sessions that do not carry a tenant id", async () => {
    authIdentityService.identity.mockReturnValue({
      ...tenantIdentity,
      tenantId: null,
    });
    authIdentityService.currentWorkspace.mockReturnValue(null);

    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(router.serializeUrl(result as never)).toBe("/forbidden");
  });

  it("blocks owner sessions from tenant routes when no impersonation context exists", async () => {
    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(router.serializeUrl(result as never)).toBe("/forbidden");
  });

  it("allows owner sessions into tenant routes only with impersonation context", async () => {
    tenantImpersonationService.canAccessTenantWorkspace.mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(result).toBe(true);
  });

  it("redirects password-change-required tenant navigation to the forced form", async () => {
    authIdentityService.identity.mockReturnValue({
      ...tenantIdentity,
      passwordChangeRequired: true,
    });

    const result = await TestBed.runInInjectionContext(() => passwordChangeRequiredGuard(
      {} as never,
      { url: "/tenant/overview" } as never,
    ));

    expect(router.serializeUrl(result as never)).toBe("/tenant/change-password");
  });

  it("redirects unflagged users away from the forced form", async () => {
    authIdentityService.identity.mockReturnValue(tenantIdentity);

    const result = await TestBed.runInInjectionContext(() => passwordChangeRequiredGuard(
      {} as never,
      { url: "/tenant/change-password" } as never,
    ));

    expect(router.serializeUrl(result as never)).toBe("/tenant/overview");
  });

  it("does not route through owner when no workspace is resolved", async () => {
    dashboardService.currentRole.mockReturnValue(null);
    authIdentityService.currentWorkspace.mockReturnValue(null);

    const result = await TestBed.runInInjectionContext(() => roleGuard({
      data: { role: "tenant" },
    } as never, []));

    expect(router.serializeUrl(result as never)).toBe("/forbidden");
  });
});
