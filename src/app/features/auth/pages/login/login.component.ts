import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

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

  private getRoleFromUrl(): UserRole {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    if (firstSegment === 'owner' || firstSegment === 'tenant' || firstSegment === 'teacher') {
      return firstSegment;
    }

    return 'owner';
  }
}
