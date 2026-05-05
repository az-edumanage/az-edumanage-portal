import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { AuthTokenService } from '../../../../core/auth/auth-token.service';
import { DashboardService, UserRole } from '../../../../core/services/dashboard.service';
import { buildOAuthStartUrl, OAuthProvider } from '../../../../core/auth/oauth-endpoints';
import { OwnerUsersDataService } from '../../../owner/data-access/owner-users-data.service';

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
  private readonly authTokenService = inject(AuthTokenService);
  private readonly authIdentityService = inject(AuthIdentityService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly ownerUsersData = inject(OwnerUsersDataService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly infoMessage = signal<string | null>(null);
  readonly oauthProcessing = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    void this.handleOAuthCallback();

    const registered = this.route.snapshot.queryParamMap.get('registered');
    const username = this.route.snapshot.queryParamMap.get('username');
    if (registered === '1') {
      this.infoMessage.set(
        username ? `Registration completed for ${username}. Please sign in.` : 'Registration completed. Please sign in.',
      );
    }
  }

  private async handleOAuthCallback(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const oauthStatus = params.get('oauth');

    if (!oauthStatus) {
      return;
    }

    this.oauthProcessing.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    if (oauthStatus === 'error') {
      const reason = params.get('reason') || 'OAuth authentication failed';
      this.errorMessage.set(this.humanizeOAuthError(reason));
      await this.clearOAuthQueryParams();
      this.oauthProcessing.set(false);
      return;
    }

    if (oauthStatus === 'success') {
      const accessToken = params.get('accessToken');
      if (!accessToken) {
        this.errorMessage.set('OAuth login failed: access token missing from callback.');
        await this.clearOAuthQueryParams();
        this.oauthProcessing.set(false);
        return;
      }

      try {
        this.authTokenService.setToken(accessToken);
        const me = await this.authApi.me();
        const callbackUsername = params.get('username')?.trim() || '';
        const email = this.resolveOAuthEmail(me.username, callbackUsername);
        if (email) {
          const fullName = this.resolveDisplayName(callbackUsername || me.username);
          this.ownerUsersData.upsertOAuthWebUser({
            email,
            username: callbackUsername || me.username,
            fullName,
            status: 'Active',
          });
        }
        this.authIdentityService.setIdentity({
          username: me.username,
          roles: me.roles ?? [],
          primaryRole: me.primaryRole,
          tenantId: me.tenantId ?? null,
        });

        await this.clearOAuthQueryParams();
        this.dashboardService.setRole(this.roleFromPrimaryRole(me.primaryRole));
        return;
      } catch {
        this.authTokenService.clearToken();
        this.authIdentityService.clearIdentity();
        this.errorMessage.set('OAuth login was successful but session initialization failed. Please try again.');
        await this.clearOAuthQueryParams();
      } finally {
        this.oauthProcessing.set(false);
      }
    } else {
      await this.clearOAuthQueryParams();
      this.oauthProcessing.set(false);
    }
  }

  private resolveOAuthEmail(primary: string, fallback: string): string {
    if (this.isEmail(primary)) return primary.toLowerCase();
    if (this.isEmail(fallback)) return fallback.toLowerCase();
    return '';
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private resolveDisplayName(raw: string): string {
    const base = raw.includes('@') ? raw.split('@')[0] : raw;
    return base
      .split(/[._-]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ') || 'Web User';
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const { username, password } = this.form.getRawValue();
      const role = this.getRoleFromUrl();
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl) {
        this.dashboardService.returnUrl.set(returnUrl);
      }
      await this.authApi.login(username, password, role);
      this.dashboardService.setRole(role);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 403) {
          this.errorMessage.set('This account is not allowed to access the selected workspace.');
        } else if (error.status === 400 || error.status === 401) {
          this.errorMessage.set('Invalid username or password. Please try again.');
        } else {
          this.errorMessage.set('Unable to reach authentication server. Check backend and API URL.');
        }
      } else {
        this.errorMessage.set('Unable to sign in right now. Please try again.');
      }
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

  signInWithGoogle(): void {
    this.redirectToExternalAuth('google');
  }

  signInWithMicrosoft(): void {
    this.redirectToExternalAuth('microsoft');
  }

  private getRoleFromUrl(): UserRole {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    if (firstSegment === 'owner' || firstSegment === 'tenant' || firstSegment === 'teacher') {
      return firstSegment;
    }

    return 'owner';
  }

  private redirectToExternalAuth(provider: OAuthProvider): void {
    const callbackUrl = `${window.location.origin}/owner/login`;
    const url = buildOAuthStartUrl(provider, callbackUrl);
    window.location.assign(url);
  }

  private roleFromPrimaryRole(primaryRole: string): UserRole {
    if (primaryRole === 'SUPER_ADMIN' || primaryRole === 'OWNER') return 'owner';
    if (primaryRole === 'TENANT_ADMIN') return 'tenant';
    if (primaryRole === 'TEACHER') return 'teacher';
    return 'owner';
  }

  private humanizeOAuthError(reason: string): string {
    const normalized = reason.toLowerCase();
    if (normalized.includes('email_not_provided')) {
      return 'OAuth provider did not return an email address. Please use another account.';
    }
    if (normalized.includes('access_denied')) {
      return 'OAuth login was cancelled or denied.';
    }
    return 'OAuth login failed. Please try again.';
  }

  private async clearOAuthQueryParams(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        oauth: null,
        accessToken: null,
        username: null,
        provider: null,
        reason: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
