import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from '../auth/auth-token.service';
import { AuthApiService } from '../auth/auth-api.service';
import { TenantImpersonationService } from '../auth/tenant-impersonation.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { Router } from '@angular/router';
import { catchError, EMPTY, from, switchMap, throwError } from 'rxjs';

function isAuthEndpoint(url: string): boolean {
  return url.endsWith('/auth/login') || url.endsWith('/auth/refresh') || url.endsWith('/auth/logout');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const authApi = inject(AuthApiService);
  const tenantImpersonation = inject(TenantImpersonationService);
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const token = tokenService.getToken();

  if (!token || isAuthEndpoint(req.url)) {
    return next(req);
  }

  if (authSession.isTokenExpired(token)) {
    return from(authSession.refreshSession(router.url)).pipe(
      switchMap((newToken) => {
        if (!newToken) {
          return EMPTY;
        }
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
            'x-refresh-retry': '1',
            ...(tenantImpersonation.impersonatedTenantId() ? { 'X-Impersonated-Tenant-Id': tenantImpersonation.impersonatedTenantId() ?? '' } : {}),
          },
        }));
      }),
    );
  }

  const impersonatedTenantId = tenantImpersonation.impersonatedTenantId();
  const authedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      ...(impersonatedTenantId ? { 'X-Impersonated-Tenant-Id': impersonatedTenantId } : {}),
    },
  });

  return next(authedRequest).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || req.headers.has('x-refresh-retry')) {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          authSession.handleSessionExpired(router.url);
        }
        return throwError(() => error);
      }

      return from(authApi.refresh()).pipe(
        switchMap((newToken) => {
          authSession.scheduleExpiry(newToken);
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
              'x-refresh-retry': '1',
              ...(impersonatedTenantId ? { 'X-Impersonated-Tenant-Id': impersonatedTenantId } : {}),
            },
          }));
        }),
        catchError((refreshError) => {
          authSession.handleSessionExpired(router.url);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
