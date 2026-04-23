import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { OwnerSecurityDataService } from '../data-access/owner-security-data.service';
import { OwnerSecurityStore } from './owner-security.store';
import { OwnerSecurityFormBundle } from '../models/owner-security.models';

@Injectable({ providedIn: 'root' })
export class OwnerSecurityFacade {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly data = inject(OwnerSecurityDataService);
  private readonly store = inject(OwnerSecurityStore);

  private isCanceled = false;

  readonly authForm = this.fb.group({
    minLength: [12, [Validators.required, Validators.min(8)]],
    passwordExpiry: [90, [Validators.required, Validators.min(0)]],
    requireUppercase: [true],
    requireNumbers: [true],
    requireSpecialChars: [true],
    maxFailedAttempts: [5, [Validators.required, Validators.min(1)]],
    lockDuration: [30, [Validators.required, Validators.min(1)]],
  });

  readonly mfaForm = this.fb.group({
    enableGlobalMfa: [false],
    roleSuperAdmin: [true],
    roleTenantAdmin: [false],
    roleSupport: [true],
    methodOtp: [true],
    methodSms: [false],
    methodEmail: [true],
    gracePeriod: [7, [Validators.required, Validators.min(0)]],
  });

  readonly sessionForm = this.fb.group({
    sessionTimeout: [24, [Validators.required, Validators.min(1)]],
    idleTimeout: [30, [Validators.required, Validators.min(1)]],
    maxConcurrentSessions: [3, [Validators.required, Validators.min(1)]],
    forceLogoutOnPassChange: [true],
  });

  readonly apiForm = this.fb.group({
    globalRateLimit: [10000, [Validators.required, Validators.min(1)]],
    tenantRateLimit: [1000, [Validators.required, Validators.min(1)]],
    ipRateLimit: [100, [Validators.required, Validators.min(1)]],
    ipWhitelist: [''],
    corsOrigins: ['*'],
  });

  readonly dataForm = this.fb.group({
    forceHttps: [true],
    secureCookies: [true],
    csrfProtection: [true],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (!savedTask?.data) {
      return;
    }

    const taskData = savedTask.data as OwnerSecurityFormBundle;
    this.authForm.patchValue(taskData.auth);
    this.mfaForm.patchValue(taskData.mfa);
    this.sessionForm.patchValue(taskData.session);
    this.apiForm.patchValue(taskData.api);
    this.dataForm.patchValue(taskData.data);
    this.taskService.removeTask(this.store.taskId());
  }

  onDestroy(): void {
    const isDirty =
      this.authForm.dirty ||
      this.mfaForm.dirty ||
      this.sessionForm.dirty ||
      this.apiForm.dirty ||
      this.dataForm.dirty;

    if (isDirty && !this.isCanceled) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: 'Editing Security Policies',
        route: '/owner/security',
        data: {
          auth: this.authForm.getRawValue(),
          mfa: this.mfaForm.getRawValue(),
          session: this.sessionForm.getRawValue(),
          api: this.apiForm.getRawValue(),
          data: this.dataForm.getRawValue(),
        },
      });
    }
  }

  onCancel(): void {
    this.isCanceled = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/owner/overview']);
  }

  saveAuthPolicies(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.data.saveAuthPolicies(this.authForm.getRawValue()).subscribe(() => {
      this.authForm.markAsPristine();
    });
  }

  saveMfaPolicies(): void {
    if (this.mfaForm.invalid) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    this.data.saveMfaPolicies(this.mfaForm.getRawValue()).subscribe(() => {
      this.mfaForm.markAsPristine();
    });
  }

  saveSessionPolicies(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.data.saveSessionPolicies(this.sessionForm.getRawValue()).subscribe(() => {
      this.sessionForm.markAsPristine();
    });
  }

  saveApiPolicies(): void {
    if (this.apiForm.invalid) {
      this.apiForm.markAllAsTouched();
      return;
    }

    this.data.saveApiPolicies(this.apiForm.getRawValue()).subscribe(() => {
      this.apiForm.markAsPristine();
    });
  }

  saveDataProtection(): void {
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }

    this.data.saveDataProtection(this.dataForm.getRawValue()).subscribe(() => {
      this.dataForm.markAsPristine();
    });
  }
}
