import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { DashboardService, UserRole } from '../services/dashboard.service';

export const roleGuard: CanMatchFn = (route) => {
  const dashboardService = inject(DashboardService);
  const router = inject(Router);

  const expectedRole = route.data?.['role'] as UserRole | undefined;
  if (!expectedRole || dashboardService.currentRole() === expectedRole) {
    return true;
  }

  return router.createUrlTree([`/${dashboardService.currentRole()}/overview`]);
};
