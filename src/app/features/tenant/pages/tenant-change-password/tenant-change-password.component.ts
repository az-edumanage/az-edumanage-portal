import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthApiService } from '../../../../core/auth/auth-api.service';

type ChangePasswordStatus = 'idle' | 'saving' | 'success' | 'error';

@Component({
  selector: 'app-tenant-change-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-change-password.component.html',
  styleUrl: './tenant-change-password.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly status = signal<ChangePasswordStatus>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = computed(() => this.status() === 'saving');
  readonly showBlockingModal = computed(() => this.status() === 'saving' || this.status() === 'success');
  readonly modalMessage = computed(() => this.status() === 'success'
    ? 'تم تحديث كلمة المرور بنجاح'
    : 'جاري تحديث كلمة المرور...');

  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  async save(): Promise<void> {
    this.errorMessage.set(null);
    this.form.setErrors(null);

    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.form.setErrors({ passwordMismatch: true });
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('saving');
    try {
      await this.authApi.changeInitialPassword(newPassword, confirmPassword);
      await this.authApi.me();
      this.form.reset();
      this.status.set('success');
      await this.delay(1200);
      await this.router.navigate(['/tenant/overview'], { replaceUrl: true });
    } catch (error) {
      this.status.set('error');
      if (error instanceof HttpErrorResponse && error.error?.message) {
        this.errorMessage.set(error.error.message);
      } else {
        this.errorMessage.set('Unable to change password. Please try again.');
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
