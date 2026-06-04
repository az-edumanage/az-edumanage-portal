import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

describe('LoginComponent', () => {
  let authApi: {
    login: ReturnType<typeof vi.fn>;
  };
  let dashboardService: {
    returnUrl: ReturnType<typeof signal<string | null>>;
    setRole: ReturnType<typeof vi.fn>;
  };
  let authSession: {
    scheduleExpiry: ReturnType<typeof vi.fn>;
  };

  function configure(url = '/tenant/login', queryParams: Record<string, string> = {}): void {
    authApi = {
      login: vi.fn().mockResolvedValue({ accessToken: 'token', passwordChangeRequired: false }),
    };
    dashboardService = {
      returnUrl: signal<string | null>(null),
      setRole: vi.fn(),
    };
    authSession = {
      scheduleExpiry: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthApiService, useValue: authApi },
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: Router, useValue: { url, navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    });
  }

  it('submits tenant workspace credentials through the shared auth endpoint', async () => {
    configure('/tenant/login');
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'tenant-user',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('tenant-user', 'secret', 'tenant');
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant');
  });

  it('redirects flagged tenant logins to forced password change', async () => {
    configure('/tenant/login');
    authApi.login.mockResolvedValue({ accessToken: 'token', passwordChangeRequired: true });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'tenant-user',
      password: 'secret',
    });

    await component.submit();

    expect(authSession.scheduleExpiry).toHaveBeenCalledWith('token');
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/change-password'], { replaceUrl: true });
    expect(dashboardService.setRole).not.toHaveBeenCalled();
  });

  it('preserves redirect before entering the tenant workspace', async () => {
    configure('/tenant/login', { redirect: '/tenant/overview' });
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'tenant-user',
      password: 'secret',
    });

    await component.submit();

    expect(dashboardService.returnUrl()).toBe('/tenant/overview');
    expect(authSession.scheduleExpiry).toHaveBeenCalledWith('token');
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant');
  });


  it('keeps owner login on the normal owner flow when password change is not required', async () => {
    configure('/owner/login');
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'owner-user',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('owner-user', 'secret', 'owner');
    expect(authSession.scheduleExpiry).toHaveBeenCalledWith('token');
    expect(dashboardService.setRole).toHaveBeenCalledWith('owner');
    expect(router.navigate).not.toHaveBeenCalledWith(['/tenant/change-password'], { replaceUrl: true });
  });

  it('keeps teacher login on the normal teacher flow when password change is not required', async () => {
    configure('/teacher/login');
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'teacher-user',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('teacher-user', 'secret', 'teacher');
    expect(authSession.scheduleExpiry).toHaveBeenCalledWith('token');
    expect(dashboardService.setRole).toHaveBeenCalledWith('teacher');
    expect(router.navigate).not.toHaveBeenCalledWith(['/tenant/change-password'], { replaceUrl: true });
  });

  it('does not route flagged teacher logins through tenant or owner password change', async () => {
    configure('/teacher/login');
    authApi.login.mockResolvedValue({ accessToken: 'token', passwordChangeRequired: true });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'teacher-user',
      password: 'secret',
    });

    await component.submit();

    expect(router.navigate).not.toHaveBeenCalledWith(['/tenant/change-password'], { replaceUrl: true });
    expect(router.navigate).not.toHaveBeenCalledWith(['/owner/change-password'], { replaceUrl: true });
    expect(dashboardService.setRole).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('This workspace does not support forced password change yet.');
  });

  it('does not route flagged owner logins through tenant password change', async () => {
    configure('/owner/login');
    authApi.login.mockResolvedValue({ accessToken: 'token', passwordChangeRequired: true });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'owner-user',
      password: 'secret',
    });

    await component.submit();

    expect(router.navigate).not.toHaveBeenCalledWith(['/tenant/change-password'], { replaceUrl: true });
    expect(dashboardService.setRole).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('This workspace does not support forced password change yet.');
  });

  it('shows a clear invalid-credentials message for tenant login failures', async () => {
    configure('/tenant/login');
    authApi.login.mockRejectedValue(new HttpErrorResponse({
      status: 401,
      url: '/api/v1/auth/login',
    }));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'tenant-user',
      password: 'bad-secret',
    });

    await component.submit();

    expect(component.errorMessage()).toBe('Invalid username or password. Please try again.');
    expect(dashboardService.setRole).not.toHaveBeenCalled();
  });
});
