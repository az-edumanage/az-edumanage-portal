import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from '../auth/auth-token.service';
import { AuthApiService } from '../auth/auth-api.service';
import { AuthIdentityService } from '../auth/auth-identity.service';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

function isAuthEndpoint(url: string): boolean {
  return url.endsWith('/auth/login') || url.endsWith('/auth/refresh') || url.endsWith('/auth/logout');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const authApi = inject(AuthApiService);
  const authIdentity = inject(AuthIdentityService);
  const dashboardService = inject(DashboardService);
  const router = inject(Router);
  const token = tokenService.getToken();

  if (!token || isAuthEndpoint(req.url)) {
    return next(req);
  }

  const authedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authedRequest).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || req.headers.has('x-refresh-retry')) {
        return throwError(() => error);
      }

      return from(authApi.refresh()).pipe(
        switchMap((newToken) => next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
            'x-refresh-retry': '1',
          },
        }))),
        catchError((refreshError) => {
          tokenService.clearToken();
          authIdentity.clearIdentity();
          dashboardService.returnUrl.set(null);
          const role = dashboardService.currentRole();
          void router.navigate([`/${role}/login`]);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
