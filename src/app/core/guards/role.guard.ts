import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { DashboardService, UserRole } from '../services/dashboard.service';
import { AuthIdentityService } from '../auth/auth-identity.service';

export const roleGuard: CanMatchFn = (route) => {
  const dashboardService = inject(DashboardService);
  const authIdentityService = inject(AuthIdentityService);
  const router = inject(Router);

  const expectedRole = route.data?.['role'] as UserRole | undefined;
  const authenticatedRole = authIdentityService.currentWorkspace() ?? dashboardService.currentRole();

  if (!expectedRole || authenticatedRole === expectedRole) {
    return true;
  }

  return router.createUrlTree([`/${authenticatedRole}/overview`]);
};
