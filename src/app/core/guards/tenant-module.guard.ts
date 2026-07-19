import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';

import { AuthIdentityService } from '../auth/auth-identity.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { requiredModulesForUrl, type TenantModuleCode } from '../auth/tenant-module-entitlements';

export const tenantModuleAccessGuard: CanActivateChildFn = (_route, state) => {
  const identity = inject(AuthIdentityService);
  const router = inject(Router);
  const requiredModules = requiredModulesForUrl(state.url);

  return identity.hasAllModules(requiredModules)
    ? true
    : router.createUrlTree(['/tenant/access-denied'], { queryParams: { modules: requiredModules.join(',') } });
};

export const workspaceFeatureModuleGuard: CanActivateChildFn = (_route, state) => {
  const identity = inject(AuthIdentityService);
  const router = inject(Router);
  const requiredModules = requiredModulesForUrl(state.url);

  return identity.hasAllModules(requiredModules)
    ? true
    : router.createUrlTree(['/forbidden']);
};

export const workspaceModuleGuard: CanMatchFn = async (route) => {
  const identity = inject(AuthIdentityService);
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const requiredModule = route.data?.['requiredModule'] as TenantModuleCode | undefined;
  const requiredModules = route.data?.['requiredModules'] as TenantModuleCode[] | undefined;
  const modules = requiredModules ?? (requiredModule ? [requiredModule] : []);

  if (modules.length === 0) {
    return true;
  }
  if (!identity.identity()) {
    await session.hydrateFromBackend();
  }
  return identity.hasAllModules(modules) ? true : router.createUrlTree(['/forbidden']);
};
