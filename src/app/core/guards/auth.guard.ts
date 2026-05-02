import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthTokenService } from '../auth/auth-token.service';
import { UserRole } from '../services/dashboard.service';

function buildReturnUrl(segments: UrlSegment[]): string {
  const url = segments.map((segment) => segment.path).join('/');
  return `/${url}`;
}

export const authGuard: CanMatchFn = (route, segments) => {
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);

  if (tokenService.getToken()) {
    return true;
  }

  const role = (route.data?.['role'] as UserRole | undefined) ?? 'owner';
  const returnUrl = buildReturnUrl(segments);

  return router.createUrlTree([`/${role}/login`], {
    queryParams: { returnUrl },
  });
};
