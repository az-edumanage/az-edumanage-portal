import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import type { LoginResponse } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { safeRedirect } from '../../../../core/auth/auth-url.utils';
import { DashboardService, UserRole } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
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

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();
    const role = this.getRoleFromUrl();
    const redirect = safeRedirect(this.route.snapshot.queryParamMap.get('redirect'))
      ?? safeRedirect(this.route.snapshot.queryParamMap.get('returnUrl'));
    if (redirect) {
      this.dashboardService.returnUrl.set(redirect);
    }

    let loginResponse: LoginResponse;
    try {
      loginResponse = await this.authApi.login(username, password, role);
    } catch (error) {
      this.errorMessage.set(this.loginErrorMessage(error));
      this.submitting.set(false);
      return;
    }

    try {
      this.authSession.scheduleExpiry(loginResponse.accessToken);
      if (loginResponse.passwordChangeRequired === true) {
        const changePasswordUrl = this.changePasswordUrlForRole(role);
        if (changePasswordUrl) {
          await this.router.navigate([changePasswordUrl], { replaceUrl: true });
        } else {
          this.errorMessage.set('This workspace does not support forced password change yet.');
        }
        return;
      }
      await this.dashboardService.setRole(role);
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

  continueAsGuest(): void {
    this.dashboardService.setRole(this.getRoleFromUrl());
  }

  private changePasswordUrlForRole(role: UserRole): string | null {
    if (role === 'tenant') {
      return '/tenant/change-password';
    }
    return null;
  }

  private getRoleFromUrl(): UserRole {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    if (firstSegment === 'owner' || firstSegment === 'tenant' || firstSegment === 'teacher') {
      return firstSegment;
    }

    return 'owner';
  }

  private loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'This account is not allowed to access the selected workspace.';
      }
      if (error.status === 400 || error.status === 401) {
        return 'Invalid username or password. Please try again.';
      }
      return 'Unable to reach authentication server. Check backend and API URL.';
    }

    return 'Unable to sign in right now. Please try again.';
  }
}
