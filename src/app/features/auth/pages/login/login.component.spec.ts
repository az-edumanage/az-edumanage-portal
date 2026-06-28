import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { TenantHostContextService } from '../../../../core/auth/tenant-host-context.service';

describe('LoginComponent', () => {
  let authApi: {
    login: ReturnType<typeof vi.fn>;
    requestPasswordReset: ReturnType<typeof vi.fn>;
  };
  let dashboardService: {
    returnUrl: ReturnType<typeof signal<string | null>>;
    setRole: ReturnType<typeof vi.fn>;
  };
  let authSession: {
    scheduleExpiry: ReturnType<typeof vi.fn>;
    refreshSession: ReturnType<typeof vi.fn>;
  };
  let tenantHostContext: {
    isTenantHost: ReturnType<typeof signal<boolean>>;
    context: ReturnType<typeof signal<{ contextType: string; hostname: string; subdomain: string | null }>>;
  };

  function configure(url = '/tenant/login', queryParams: Record<string, string> = {}, isTenantHost = false): void {
    authApi = {
      login: vi.fn().mockResolvedValue({ accessToken: 'token', passwordChangeRequired: false }),
      requestPasswordReset: vi.fn().mockResolvedValue({ message: 'If this email exists, a reset link has been sent.' }),
    };
    dashboardService = {
      returnUrl: signal<string | null>(null),
      setRole: vi.fn(),
    };
    authSession = {
      scheduleExpiry: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(null),
    };
    tenantHostContext = {
      isTenantHost: signal(isTenantHost),
      context: signal({
        contextType: isTenantHost ? 'tenant' : 'platform',
        hostname: isTenantHost ? 'hussein.az-edumanage.com' : 'az-edumanage.com',
        subdomain: isTenantHost ? 'hussein' : null,
      }),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthApiService, useValue: authApi },
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: TenantHostContextService, useValue: tenantHostContext },
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

  it('uses tenant workspace login from tenant subdomain root', async () => {
    configure('/', {}, true);
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

  it('opens the returned teacher dashboard from the shared tenant login form', async () => {
    configure('/tenant/login', {}, true);
    authApi.login.mockResolvedValue({
      accessToken: 'teacher-token',
      username: 'teacher-user',
      roles: ['TEACHER'],
      primaryRole: 'TEACHER',
      workspace: 'teacher',
      tenantId: 'tenant-1',
      passwordChangeRequired: false,
    });
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'teacher-user',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('teacher-user', 'secret', 'tenant');
    expect(dashboardService.setRole).toHaveBeenCalledWith('teacher');
  });

  it('supports student and parent workspace login paths', async () => {
    configure('/student/login');
    let fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ username: 'student-user', password: 'secret' });
    await fixture.componentInstance.submit();
    expect(authApi.login).toHaveBeenCalledWith('student-user', 'secret', 'student');

    TestBed.resetTestingModule();
    configure('/parent/login');
    fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ username: 'parent-user', password: 'secret' });
    await fixture.componentInstance.submit();
    expect(authApi.login).toHaveBeenCalledWith('parent-user', 'secret', 'parent');
  });

  it('labels tenant credentials as username or email and submits a trimmed email', async () => {
    configure('/tenant/login');
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('label[for="username"]')?.textContent?.trim()).toBe('Username or email');
    expect(nativeElement.querySelector<HTMLInputElement>('#username')?.placeholder).toBe('Enter username or email');

    component.form.setValue({
      username: ' admin@example.com ',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('admin@example.com', 'secret', 'tenant');
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

    expect(component.errorMessage()).toBe('Invalid username/email or password. Please try again.');
    expect(dashboardService.setRole).not.toHaveBeenCalled();
  });

  it('does not show a generic sign-in failure when post-login tenant navigation fails', async () => {
    configure('/tenant/login');
    dashboardService.setRole.mockRejectedValue(new Error('Navigation failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      username: 'tenant-user',
      password: 'secret',
    });

    await component.submit();

    expect(authApi.login).toHaveBeenCalledWith('tenant-user', 'secret', 'tenant');
    expect(authSession.scheduleExpiry).toHaveBeenCalledWith('token');
    expect(component.errorMessage()).toBe('Signed in, but unable to open the selected workspace. Please refresh the page.');
    expect(component.errorMessage()).not.toBe('Unable to sign in right now. Please try again.');

    consoleError.mockRestore();
  });

  it('tries refresh-token recovery on expired owner login URLs', async () => {
    configure('/owner/login?expired=1&redirect=%2F', { expired: '1', redirect: '/' });
    authSession.refreshSession.mockResolvedValue('fresh-token');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(dashboardService.returnUrl()).toBeNull();
    expect(authSession.refreshSession).toHaveBeenCalledWith('/owner/login?expired=1&redirect=%2F', false);
    expect(dashboardService.setRole).toHaveBeenCalledWith('owner');
  });

  it('tries refresh-token recovery on expired tenant login URLs without using root redirect', async () => {
    configure('/tenant/login?expired=1&redirect=%2F', { expired: '1', redirect: '/' });
    authSession.refreshSession.mockResolvedValue('fresh-token');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(dashboardService.returnUrl()).toBeNull();
    expect(authSession.refreshSession).toHaveBeenCalledWith('/tenant/login?expired=1&redirect=%2F', false);
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant');
  });

  it('preserves same-workspace redirects during expired tenant refresh recovery', async () => {
    configure('/tenant/login?expired=1&redirect=%2Ftenant%2Fgroups', { expired: '1', redirect: '/tenant/groups' });
    authSession.refreshSession.mockResolvedValue('fresh-token');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(dashboardService.returnUrl()).toBe('/tenant/groups');
    expect(dashboardService.setRole).toHaveBeenCalledWith('tenant');
  });

  it('prefills forgot-password email from username and requests a reset link', async () => {
    configure('/tenant/login');
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      username: 'admin@example.com',
    });

    component.openForgotPassword();
    expect(component.forgotPasswordOpen()).toBe(true);
    expect(component.forgotPasswordEmail.value).toBe('admin@example.com');

    await component.requestPasswordReset();

    expect(authApi.requestPasswordReset).toHaveBeenCalledWith('admin@example.com', expect.any(String));
    expect(component.forgotPasswordMessage()).toBe('If this email exists, a reset link has been sent.');
    expect(component.forgotPasswordError()).toBeNull();
  });

  it('validates forgot-password email before sending a reset request', async () => {
    configure('/tenant/login');
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.openForgotPassword();
    component.forgotPasswordEmail.setValue('not-an-email');

    await component.requestPasswordReset();

    expect(authApi.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.forgotPasswordEmail.touched).toBe(true);
  });
});
