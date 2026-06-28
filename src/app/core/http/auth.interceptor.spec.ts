import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthTokenService } from '../auth/auth-token.service';
import { AuthApiService } from '../auth/auth-api.service';
import { TenantImpersonationService } from '../auth/tenant-impersonation.service';
import { AuthSessionService } from '../auth/auth-session.service';

describe('authInterceptor', () => {
  it('adds bearer auth without adding a client-controlled tenant header', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthTokenService, useValue: { getToken: () => 'token' } },
        { provide: AuthApiService, useValue: { refresh: vi.fn() } },
        { provide: TenantImpersonationService, useValue: { impersonatedTenantId: () => null } },
        {
          provide: AuthSessionService,
          useValue: {
            isTokenExpired: () => false,
            refreshSession: vi.fn(),
            scheduleExpiry: vi.fn(),
            handleSessionExpired: vi.fn(),
          },
        },
      ],
    });

    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);

    http.get('/api/v1/tenant/students').subscribe();

    const request = httpTesting.expectOne('/api/v1/tenant/students');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.request.headers.has('X-Tenant-Id')).toBe(false);
    expect(request.request.headers.has('x-tenant-id')).toBe(false);
    request.flush({});
    httpTesting.verify();
  });
});
