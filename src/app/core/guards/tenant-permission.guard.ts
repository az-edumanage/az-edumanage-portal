import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

import { TenantPermissionService } from '../auth/tenant-permission.service';

export const tenantPermissionGuard: CanActivateChildFn = (route) => {
  const permissions = inject(TenantPermissionService);
  const router = inject(Router);
  const requiredPermission = route.data?.['requiredPermission'] as string | undefined;
  const requiredPermissions = route.data?.['requiredPermissions'] as string[] | undefined;

  if (permissions.hasPermission(requiredPermission) && permissions.hasAllPermissions(requiredPermissions)) {
    return true;
  }

  return router.createUrlTree(['/tenant/access-denied']);
};
