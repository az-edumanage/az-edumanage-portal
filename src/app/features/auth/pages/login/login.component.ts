import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import type { LoginResponse } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { safeRedirect } from '../../../../core/auth/auth-url.utils';
import { TenantHostContextService } from '../../../../core/auth/tenant-host-context.service';
import { DashboardService, UserRole } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tenantHostContext = inject(TenantHostContextService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly infoMessage = signal<string | null>(null);
  readonly forgotPasswordOpen = signal(false);
  readonly forgotPasswordSubmitting = signal(false);
  readonly forgotPasswordMessage = signal<string | null>(null);
  readonly forgotPasswordError = signal<string | null>(null);
  readonly workspaceRole = signal<UserRole>('owner');
  readonly workspaceTitle = computed(() => this.workspaceCopy()[this.workspaceRole()].title);
  readonly workspaceDescription = computed(() => this.workspaceCopy()[this.workspaceRole()].description);
  readonly tenantSubdomain = computed(() => this.tenantHostContext.context().subdomain);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });
  readonly forgotPasswordEmail = this.fb.nonNullable.control('', [Validators.required, Validators.email]);

  constructor() {
    this.workspaceRole.set(this.getRoleFromUrl());
    const registered = this.route.snapshot.queryParamMap.get('registered');
    const username = this.route.snapshot.queryParamMap.get('username');
    if (registered === '1') {
      this.infoMessage.set(
        username ? `Registration completed for ${username}. Please sign in.` : 'Registration completed. Please sign in.',
      );
    } else if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      this.infoMessage.set('Your session expired. Please sign in again.');
    }
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      void this.recoverExpiredSession();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();
    const usernameOrEmail = username.trim();
    const role = this.workspaceRole();

    let loginResponse: LoginResponse;
    try {
      loginResponse = await this.authApi.login(usernameOrEmail, password, role);
    } catch (error) {
      this.errorMessage.set(this.loginErrorMessage(error));
      this.submitting.set(false);
      return;
    }

    try {
      this.authSession.scheduleExpiry(loginResponse.accessToken);
      const authenticatedRole = this.authenticatedRole(loginResponse) ?? role;
      this.dashboardService.returnUrl.set(this.workspaceRedirect(authenticatedRole));
      if (loginResponse.passwordChangeRequired === true) {
        const changePasswordUrl = this.changePasswordUrlForRole(authenticatedRole);
        if (changePasswordUrl) {
          await this.router.navigate([changePasswordUrl], { replaceUrl: true });
        } else {
          this.errorMessage.set('This workspace does not support forced password change yet.');
        }
        return;
      }
      await this.dashboardService.setRole(authenticatedRole);
    } catch (error) {
      console.error('Post-login navigation failed', error);
      this.errorMessage.set('Signed in, but unable to open the selected workspace. Please refresh the page.');
    } finally {
      this.submitting.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  openForgotPassword(): void {
    const username = this.form.controls.username.value.trim();
    if (username.includes('@') && !this.forgotPasswordEmail.value) {
      this.forgotPasswordEmail.setValue(username);
    }
    this.forgotPasswordOpen.set(true);
    this.forgotPasswordMessage.set(null);
    this.forgotPasswordError.set(null);
  }

  closeForgotPassword(): void {
    this.forgotPasswordOpen.set(false);
    this.forgotPasswordSubmitting.set(false);
    this.forgotPasswordError.set(null);
  }

  async requestPasswordReset(): Promise<void> {
    if (this.forgotPasswordEmail.invalid || this.forgotPasswordSubmitting()) {
      this.forgotPasswordEmail.markAsTouched();
      return;
    }

    this.forgotPasswordSubmitting.set(true);
    this.forgotPasswordMessage.set(null);
    this.forgotPasswordError.set(null);

    try {
      const response = await this.authApi.requestPasswordReset(
        this.forgotPasswordEmail.value.trim(),
        this.frontendBaseUrl(),
      );
      this.forgotPasswordMessage.set(response.message);
    } catch (error) {
      console.error('Password reset request failed', error);
      this.forgotPasswordError.set('Unable to request a reset link right now. Please try again.');
    } finally {
      this.forgotPasswordSubmitting.set(false);
    }
  }

  private workspaceCopy(): Record<UserRole, { title: string; description: string }> {
    return {
      owner: {
        title: 'Owner workspace',
        description: 'Manage tenants, billing, platform settings, and operational access.',
      },
      tenant: {
        title: 'Admin workspace',
        description: 'Continue managing students, groups, attendance, payments, and academic settings.',
      },
      teacher: {
        title: 'Teacher workspace',
        description: 'Open your teaching tools, assigned groups, sessions, and classroom updates.',
      },
      student: {
        title: 'Student workspace',
        description: 'Open classes, attendance, exams, invoices, and learning updates.',
      },
      parent: {
        title: 'Parent workspace',
        description: 'Follow student progress, attendance, invoices, and school updates.',
      },
    };
  }

  private changePasswordUrlForRole(role: UserRole): string | null {
    if (role === 'tenant') {
      return '/tenant/change-password';
    }
    return null;
  }

  private authenticatedRole(response: LoginResponse): UserRole | null {
    if (response.workspace === 'owner' || response.workspace === 'tenant' || response.workspace === 'teacher' || response.workspace === 'student' || response.workspace === 'parent') {
      return response.workspace;
    }
    const normalizedRole = (response.primaryRole ?? '').trim().toUpperCase();
    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER') return 'owner';
    if (normalizedRole === 'TENANT_ADMIN' || normalizedRole === 'WEB_USER') return 'tenant';
    if (normalizedRole === 'TEACHER') return 'teacher';
    if (normalizedRole === 'STUDENT') return 'student';
    if (normalizedRole === 'PARENT') return 'parent';
    return null;
  }

  private frontendBaseUrl(): string {
    return globalThis.location?.origin ?? '';
  }

  private async recoverExpiredSession(): Promise<void> {
    const role = this.getRoleFromUrl();
    const redirect = this.workspaceRedirect(role);
    if (redirect) {
      this.dashboardService.returnUrl.set(redirect);
    }

    this.submitting.set(true);
    const token = await this.authSession.refreshSession(this.router.url, false);
    if (!token) {
      this.submitting.set(false);
      return;
    }

    await this.dashboardService.setRole(role);
    this.submitting.set(false);
  }

  private workspaceRedirect(role: UserRole): string | null {
    const redirect = safeRedirect(this.route.snapshot.queryParamMap.get('redirect'))
      ?? safeRedirect(this.route.snapshot.queryParamMap.get('returnUrl'));
    if (!redirect || redirect === '/') {
      return null;
    }
    return redirect.startsWith(`/${role}/`) ? redirect : null;
  }

  private getRoleFromUrl(): UserRole {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    if (firstSegment === 'owner' || firstSegment === 'tenant' || firstSegment === 'teacher' || firstSegment === 'student' || firstSegment === 'parent') {
      return firstSegment;
    }
    if (this.tenantHostContext.isTenantHost()) {
      return 'tenant';
    }

    return 'owner';
  }

  private loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'This account is not allowed to access the selected workspace.';
      }
      if (error.status === 400 || error.status === 401) {
        return 'Invalid username/email or password. Please try again.';
      }
      return 'Unable to reach authentication server. Check backend and API URL.';
    }

    return 'Unable to sign in right now. Please try again.';
  }
}
