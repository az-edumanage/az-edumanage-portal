import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { TenantAccessContextService } from '../../features/tenant/data-access/tenant-access-context.service';
import { TenantOperationalStatus } from '../../features/tenant/models/tenant-access.models';

function buildAccessUrl(status: TenantOperationalStatus): string[] {
  const segment = status === 'pending' || status === 'suspended' || status === 'disabled' || status === 'blocked'
    ? status
    : 'suspended';
  return ['/tenant/access', segment];
}

export const tenantOperationalAccessGuard: CanActivateChildFn = async (_childRoute, state) => {
  const accessContextService = inject(TenantAccessContextService);
  const router = inject(Router);
  const context = await accessContextService.ensureContext(true);

  if (!context) {
    return router.createUrlTree(['/tenant/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (context.tenantOperationalStatus === 'active') {
    return true;
  }

  return router.createUrlTree(buildAccessUrl(context.tenantOperationalStatus), {
    queryParams: { returnUrl: state.url },
  });
};

export const tenantAccessStateGuard: CanActivateFn = async (route) => {
  const accessContextService = inject(TenantAccessContextService);
  const router = inject(Router);
  const context = await accessContextService.ensureContext(true);
  const expectedStatus = route.data?.['status'] as TenantOperationalStatus | undefined;

  if (!context) {
    return router.createUrlTree(['/tenant/login']);
  }

  if (context.tenantOperationalStatus === 'active') {
    return router.createUrlTree(['/tenant/overview']);
  }

  if (!expectedStatus || context.tenantOperationalStatus !== expectedStatus) {
    return router.createUrlTree(buildAccessUrl(context.tenantOperationalStatus));
  }

  return true;
};
