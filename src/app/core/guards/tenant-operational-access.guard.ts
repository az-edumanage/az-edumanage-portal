import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthIdentityService } from '../auth/auth-identity.service';
import { TenantImpersonationService } from '../auth/tenant-impersonation.service';
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
  const authIdentityService = inject(AuthIdentityService);
  const tenantImpersonationService = inject(TenantImpersonationService);
  const router = inject(Router);
  const workspace = authIdentityService.currentWorkspace();
  const context = await accessContextService.ensureContext(true);

  if (!context) {
    if (tenantImpersonationService.isActive() || workspace === 'owner' || workspace === 'tenant') {
      return router.createUrlTree(['/forbidden']);
    }
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
  const authIdentityService = inject(AuthIdentityService);
  const tenantImpersonationService = inject(TenantImpersonationService);
  const router = inject(Router);
  const workspace = authIdentityService.currentWorkspace();
  const context = await accessContextService.ensureContext(true);
  const expectedStatus = route.data?.['status'] as TenantOperationalStatus | undefined;

  if (!context) {
    if (tenantImpersonationService.isActive() || workspace === 'owner' || workspace === 'tenant') {
      return router.createUrlTree(['/forbidden']);
    }
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
