import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthTokenService } from '../../../../core/auth/auth-token.service';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { buildOAuthStartUrl, OAuthProvider } from '../../../../core/auth/oauth-endpoints';
import {
  RegistrationFlowType,
  WebsiteRegistrationService,
} from '../../../../core/auth/website-registration.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationService = inject(WebsiteRegistrationService);
  private readonly tokenService = inject(AuthTokenService);
  private readonly identityService = inject(AuthIdentityService);
  private readonly dashboardService = inject(DashboardService);

  readonly flowType = computed<RegistrationFlowType>(() =>
    this.route.snapshot.routeConfig?.path === 'free-trial' ? 'trial' : 'standard',
  );
  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(8)]],
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    if (this.submitting() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const payload = this.form.getRawValue();
      const result = await this.registrationService.register(payload, this.flowType());

      if (result.flowType === 'trial' && result.tenantId) {
        this.tokenService.setToken(`trial-${Date.now()}`);
        this.identityService.setIdentity({
          username: payload.username,
          roles: ['TENANT_ADMIN'],
          primaryRole: 'TENANT_ADMIN',
          tenantId: result.tenantId,
        });
        this.successMessage.set('Free trial activated. Provisioning completed and dashboard is ready.');
        this.dashboardService.setRole('tenant');
        return;
      }

      this.successMessage.set('Registration completed successfully. You can now sign in.');
      await this.router.navigate(['/owner/login'], {
        queryParams: { registered: '1', username: payload.username },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete registration.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  signInWithGoogle(): void {
    this.redirectToExternalAuth('google');
  }

  signInWithMicrosoft(): void {
    this.redirectToExternalAuth('microsoft');
  }

  private redirectToExternalAuth(provider: OAuthProvider): void {
    const callbackUrl = `${window.location.origin}/owner/login`;
    const url = buildOAuthStartUrl(provider, callbackUrl);
    window.location.assign(url);
  }
}
