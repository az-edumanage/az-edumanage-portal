import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api.service';
import { AuthIdentityService } from './auth-identity.service';
import { AuthTokenService } from './auth-token.service';
import { environment } from '../../../environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTestingController: HttpTestingController;
  let identityService: AuthIdentityService;
  let tokenService: AuthTokenService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthApiService,
        AuthIdentityService,
        AuthTokenService,
      ],
    });

    service = TestBed.inject(AuthApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    identityService = TestBed.inject(AuthIdentityService);
    tokenService = TestBed.inject(AuthTokenService);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('posts tenant workspace login and stores the returned tenant identity', async () => {
    const promise = service.login('tenant-user', 'secret', 'tenant');
    await Promise.resolve();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      username: 'tenant-user',
      password: 'secret',
      workspace: 'tenant',
    });

    request.flush({
      accessToken: 'tenant-token',
      username: 'tenant-user',
      roles: ['WEB_USER'],
      primaryRole: 'WEB_USER',
      workspace: 'tenant',
      tenantId: 'tenant-1',
      tenantPlan: null,
      passwordChangeRequired: false,
    });

    await expect(promise).resolves.toMatchObject({ accessToken: 'tenant-token' });
    expect(tokenService.getToken()).toBe('tenant-token');
    expect(identityService.identity()).toEqual({
      username: 'tenant-user',
      roles: ['WEB_USER'],
      primaryRole: 'WEB_USER',
      workspace: 'tenant',
      tenantId: 'tenant-1',
      tenantPlan: null,
      passwordChangeRequired: false,
    });
  });

  it('hydrates tenant workspace from auth-me metadata after refresh', async () => {
    const promise = service.me();
    await Promise.resolve();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(request.request.method).toBe('GET');

    request.flush({
      username: 'tenant-user',
      roles: ['WEB_USER'],
      primaryRole: 'WEB_USER',
      tenantId: 'tenant-1',
      tenantAccess: null,
      tenantPlan: {
        tenantId: 'tenant-1',
        planId: 'plan-1',
        planName: 'Growth',
        isTrial: false,
        subscriptionType: 'production',
        moduleCodes: ['attendance', 'billing'],
      },
    });

    await expect(promise).resolves.toMatchObject({
      username: 'tenant-user',
      primaryRole: 'WEB_USER',
      tenantId: 'tenant-1',
      tenantPlan: {
        tenantId: 'tenant-1',
        planId: 'plan-1',
        planName: 'Growth',
        isTrial: false,
        subscriptionType: 'production',
        moduleCodes: ['attendance', 'billing'],
      },
    });
    expect(identityService.identity()).toEqual({
      username: 'tenant-user',
      roles: ['WEB_USER'],
      primaryRole: 'WEB_USER',
      workspace: 'tenant',
      tenantId: 'tenant-1',
      tenantPlan: {
        tenantId: 'tenant-1',
        planId: 'plan-1',
        planName: 'Growth',
        isTrial: false,
        subscriptionType: 'production',
        moduleCodes: ['attendance', 'billing'],
      },
      passwordChangeRequired: false,
    });
  });

  it('posts initial password change requests', async () => {
    const promise = service.changeInitialPassword('NewPassword123', 'NewPassword123');
    await Promise.resolve();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/auth/initial-password/change`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });

    request.flush({ passwordChangeRequired: false });

    await expect(promise).resolves.toEqual({ passwordChangeRequired: false });
  });
});
