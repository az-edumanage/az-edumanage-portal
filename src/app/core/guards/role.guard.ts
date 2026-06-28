import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { DashboardService, UserRole } from '../services/dashboard.service';
import { AuthIdentityService } from '../auth/auth-identity.service';
import { TenantImpersonationService } from '../auth/tenant-impersonation.service';
import { AuthSessionService } from '../auth/auth-session.service';

export const roleGuard: CanMatchFn = async (route) => {
  const dashboardService = inject(DashboardService);
  const authIdentityService = inject(AuthIdentityService);
  const tenantImpersonationService = inject(TenantImpersonationService);
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  const expectedRole = route.data?.['role'] as UserRole | undefined;
  if (!expectedRole) {
    return true;
  }

  if (!authIdentityService.identity()) {
    await authSessionService.hydrateFromBackend();
  }

  const identity = authIdentityService.identity();
  const authenticatedRole = authIdentityService.currentWorkspace() ?? dashboardService.currentRole();

  if (expectedRole === 'tenant' && identity?.workspace === 'tenant' && !identity.tenantId) {
    return router.createUrlTree(['/forbidden']);
  }

  if (authenticatedRole === expectedRole) {
    dashboardService.setRole(expectedRole, false);
    return true;
  }

  if (expectedRole === 'tenant' && authenticatedRole === 'owner') {
    if (tenantImpersonationService.canAccessTenantWorkspace()) {
      dashboardService.setRole('tenant', false);
      return true;
    }
    return router.createUrlTree(['/forbidden']);
  }

  if (!authenticatedRole) {
    return router.createUrlTree(['/forbidden']);
  }

  return router.createUrlTree([`/${authenticatedRole}/overview`]);
};

async function ensureIdentityLoaded(authIdentityService: AuthIdentityService, authSessionService: AuthSessionService): Promise<void> {
  if (!authIdentityService.identity()) {
    await authSessionService.hydrateFromBackend();
  }
}

function passwordChangeDestination(workspace: UserRole | null): string | null {
  if (workspace === 'tenant') {
    return '/tenant/change-password';
  }
  if (workspace === 'teacher') {
    return '/teacher/change-password';
  }
  if (workspace === 'owner') {
    return '/owner/change-password';
  }
  return null;
}

function routedWorkspace(workspace: string | null | undefined): UserRole | null {
  if (workspace === 'owner' || workspace === 'tenant' || workspace === 'teacher' || workspace === 'student' || workspace === 'parent') {
    return workspace;
  }
  return null;
}

function overviewDestination(workspace: UserRole | null): string {
  if (workspace === 'tenant') {
    return '/tenant/overview';
  }
  if (workspace === 'teacher') {
    return '/teacher/overview';
  }
  if (workspace === 'owner') {
    return '/owner/overview';
  }
  if (workspace === 'student') {
    return '/student/overview';
  }
  if (workspace === 'parent') {
    return '/parent/overview';
  }
  return '/forbidden';
}

function passwordChangeDecision(
  identity: ReturnType<AuthIdentityService['identity']>,
  router: Router,
  dashboardService: DashboardService,
  url: string,
): true | ReturnType<Router['createUrlTree']> {
  const routeWorkspace = dashboardService.resolveWorkspaceFromUrl(url);
  const workspace = routeWorkspace ?? routedWorkspace(identity?.workspace) ?? null;
  const changePasswordUrl = passwordChangeDestination(workspace);

  if (identity?.passwordChangeRequired === true && changePasswordUrl && url !== changePasswordUrl) {
    return router.createUrlTree([changePasswordUrl]);
  }

  if (identity && identity.passwordChangeRequired !== true && changePasswordUrl && url === changePasswordUrl) {
    return router.createUrlTree([overviewDestination(workspace)]);
  }

  return true;
}

export const passwordChangeRequiredGuard: CanActivateFn = async (_route, state) => {
  const authIdentityService = inject(AuthIdentityService);
  const authSessionService = inject(AuthSessionService);
  const dashboardService = inject(DashboardService);
  const router = inject(Router);
  await ensureIdentityLoaded(authIdentityService, authSessionService);
  return passwordChangeDecision(authIdentityService.identity(), router, dashboardService, state.url);
};

export const passwordChangeRequiredChildGuard: CanActivateChildFn = async (_route, state) => {
  const authIdentityService = inject(AuthIdentityService);
  const authSessionService = inject(AuthSessionService);
  const dashboardService = inject(DashboardService);
  const router = inject(Router);
  await ensureIdentityLoaded(authIdentityService, authSessionService);
  return passwordChangeDecision(authIdentityService.identity(), router, dashboardService, state.url);
};
