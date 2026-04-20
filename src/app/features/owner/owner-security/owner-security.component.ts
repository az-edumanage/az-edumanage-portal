import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-security',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-security.component.html'})
export class OwnerSecurityComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);

  authForm: FormGroup;
  mfaForm: FormGroup;
  sessionForm: FormGroup;
  apiForm: FormGroup;
  dataForm: FormGroup;

  private isSuccess = false; // We might need granular success flags or just one global "saved something"
  // Actually, since there are multiple save buttons, "isSuccess" is ambiguous.
  // However, usually "saving" means committing to backend. If we navigate away, we want to save DRAFTS.
  // If we click "Save", we might want to clear the draft for THAT section, or just keep it until we leave.
  // Let's assume if any form is dirty, we save the task.
  private taskId = 'security-settings-task';

  constructor() {
    this.authForm = this.fb.group({
      minLength: [12, [Validators.required, Validators.min(8)]],
      passwordExpiry: [90, [Validators.required, Validators.min(0)]],
      requireUppercase: [true],
      requireNumbers: [true],
      requireSpecialChars: [true],
      maxFailedAttempts: [5, [Validators.required, Validators.min(1)]],
      lockDuration: [30, [Validators.required, Validators.min(1)]]
    });

    this.mfaForm = this.fb.group({
      enableGlobalMfa: [false],
      roleSuperAdmin: [true],
      roleTenantAdmin: [false],
      roleSupport: [true],
      methodOtp: [true],
      methodSms: [false],
      methodEmail: [true],
      gracePeriod: [7, [Validators.required, Validators.min(0)]]
    });

    this.sessionForm = this.fb.group({
      sessionTimeout: [24, [Validators.required, Validators.min(1)]],
      idleTimeout: [30, [Validators.required, Validators.min(1)]],
      maxConcurrentSessions: [3, [Validators.required, Validators.min(1)]],
      forceLogoutOnPassChange: [true]
    });

    this.apiForm = this.fb.group({
      globalRateLimit: [10000, [Validators.required, Validators.min(1)]],
      tenantRateLimit: [1000, [Validators.required, Validators.min(1)]],
      ipRateLimit: [100, [Validators.required, Validators.min(1)]],
      ipWhitelist: [''],
      corsOrigins: ['*']
    });

    this.dataForm = this.fb.group({
      forceHttps: [true],
      secureCookies: [true],
      csrfProtection: [true]
    });
  }

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      const data = savedTask.data as Record<string, Record<string, unknown>>;
      if (data['auth']) this.authForm.patchValue(data['auth']);
      if (data['mfa']) this.mfaForm.patchValue(data['mfa']);
      if (data['session']) this.sessionForm.patchValue(data['session']);
      if (data['api']) this.apiForm.patchValue(data['api']);
      if (data['data']) this.dataForm.patchValue(data['data']);
      
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Check if any form is dirty
    const isDirty = this.authForm.dirty || this.mfaForm.dirty || this.sessionForm.dirty || this.apiForm.dirty || this.dataForm.dirty;
    
    if (isDirty) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: 'Editing Security Policies',
        route: '/owner/security',
        data: {
          auth: this.authForm.value,
          mfa: this.mfaForm.value,
          session: this.sessionForm.value,
          api: this.apiForm.value,
          data: this.dataForm.value
        }
      });
    }
  }

  onCancel() {
    this.isSuccess = true; // Prevent auto-save on destroy
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/overview']);
  }

  saveAuthPolicies() {
    if (this.authForm.valid) {
      console.log('Saving Auth Policies:', this.authForm.value);
      this.authForm.markAsPristine(); // Mark as pristine so we don't save draft if only this was changed
      // Call service
    }
  }

  saveMfaPolicies() {
    if (this.mfaForm.valid) {
      console.log('Saving MFA Policies:', this.mfaForm.value);
      this.mfaForm.markAsPristine();
      // Call service
    }
  }

  saveSessionPolicies() {
    if (this.sessionForm.valid) {
      console.log('Saving Session Policies:', this.sessionForm.value);
      this.sessionForm.markAsPristine();
      // Call service
    }
  }

  saveApiPolicies() {
    if (this.apiForm.valid) {
      console.log('Saving API Policies:', this.apiForm.value);
      this.apiForm.markAsPristine();
      // Call service
    }
  }

  saveDataProtection() {
    if (this.dataForm.valid) {
      console.log('Saving Data Protection:', this.dataForm.value);
      this.dataForm.markAsPristine();
      // Call service
    }
  }
}
