import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { TenantUserCreateDataService } from '../data-access/tenant-user-create-data.service';
import { TenantUserCreateForm } from '../models/tenant-user-create.models';
import { TenantUserCreateStore } from './tenant-user-create.store';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantUserCreateDataService);
  private readonly store = inject(TenantUserCreateStore);

  private isSuccess = false;
  private editUserId: string | null = null;

  readonly roles = this.store.roles;
  readonly statuses = this.data.statuses;

  readonly userForm = this.fb.group({
    fullName: [
      '',
      {
        validators: [Validators.required],
        asyncValidators: [this.duplicateNameValidator.bind(this)],
        updateOn: 'blur',
      },
    ],
    email: [
      '',
      {
        validators: [Validators.required, Validators.email],
        asyncValidators: [this.duplicateEmailValidator.bind(this)],
        updateOn: 'blur',
      },
    ],
    username: ['', [Validators.required]],
    roleId: ['', [Validators.required]],
    enabled: [true],
    sendInvite: [true],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get isSubmitting(): boolean {
    return this.store.isSubmitting();
  }

  get isEditMode(): boolean {
    return this.editUserId !== null;
  }

  initialize(): void {
    this.editUserId = this.route.snapshot.paramMap.get('id');
    this.configureCredentialValidators();
    this.data.loadActiveRoles().subscribe((roles) => {
      this.store.setRoles(roles);
      if (!this.userForm.controls.roleId.value && roles[0]) {
        this.userForm.controls.roleId.setValue(roles[0].id);
      }
    });
    if (this.editUserId) {
      this.data.loadUser(this.editUserId).subscribe((user) => {
        if (!user) {
          return;
        }
        this.userForm.patchValue({
          fullName: user.fullName ?? user.username,
          email: user.email ?? user.username,
          username: user.username,
          roleId: user.roleId ?? '',
          enabled: user.enabled,
          sendInvite: false,
          password: '',
        });
        this.userForm.controls.email.disable();
        this.userForm.controls.username.disable();
      });
    }
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.userForm.patchValue({
        ...(savedTask.data as Partial<TenantUserCreateForm>),
        password: '',
      });
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(): void {
    const value = this.sanitizedDraftValue();
    const hasData = Object.values(value).some(
      (item) =>
        item !== '' && item !== null && item !== true,
    );

    if (hasData && !this.isSuccess && !this.store.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Adding User: ${value.fullName || 'New User'}`,
        route: '/tenant/users/create',
        data: value,
      });
    }
  }

  resetForm(): void {
    if (!confirm('Are you sure you want to clear all fields?')) {
      return;
    }

    this.userForm.reset({
      roleId: this.roles()[0]?.id ?? '',
      enabled: true,
      sendInvite: true,
      password: '',
      fullName: '',
      email: '',
      username: '',
    });
    this.taskService.removeTask(this.store.taskId());
  }

  goBack(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.location.back();
  }

  onSubmit(): void {
    if (this.store.isSubmitting()) {
      return;
    }

    this.userForm.updateValueAndValidity();
    if (this.userForm.invalid || this.userForm.pending) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);

    const payload = this.userForm.getRawValue() as TenantUserCreateForm;
    const request = this.editUserId
      ? this.data.updateUser(this.editUserId, payload)
      : this.data.createUser(payload);

    request
      .pipe(
        catchError((error: unknown) => {
          this.handleSaveError(error);
          return EMPTY;
        }),
        finalize(() => this.store.setSubmitting(false)),
      )
      .subscribe(() => {
        this.isSuccess = true;
        this.userForm.controls.password.setValue('');
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/users']);
      });
  }

  duplicateNameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) {
      return of(null);
    }

    return this.data
      .isDuplicateName(String(control.value))
      .pipe(map((exists) => (exists ? { duplicateName: true } : null)));
  }

  duplicateEmailValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) {
      return of(null);
    }

    return this.data
      .isDuplicateEmail(String(control.value))
      .pipe(map((exists) => (exists ? { duplicateEmail: true } : null)));
  }

  private configureCredentialValidators(): void {
    if (this.isEditMode) {
      this.userForm.controls.password.clearValidators();
    } else {
      this.userForm.controls.username.setValidators([Validators.required]);
      this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.userForm.controls.username.updateValueAndValidity({ emitEvent: false });
    this.userForm.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  private sanitizedDraftValue(): TenantUserCreateForm {
    return {
      ...(this.userForm.getRawValue() as TenantUserCreateForm),
      password: '',
    };
  }

  private handleSaveError(error: unknown): void {
    this.userForm.controls.password.setValue('');
    if (!(error instanceof HttpErrorResponse)) {
      return;
    }
    const message = this.errorMessage(error).toLowerCase();
    if (message.includes('username') || message.includes('user name')) {
      this.userForm.controls.username.setErrors({
        ...(this.userForm.controls.username.errors ?? {}),
        duplicateUsername: true,
      });
      this.userForm.controls.username.markAsTouched();
    }
    if (message.includes('password')) {
      this.userForm.controls.password.setErrors({
        ...(this.userForm.controls.password.errors ?? {}),
        serverPassword: true,
      });
      this.userForm.controls.password.markAsTouched();
    }
    if (message.includes('email')) {
      this.userForm.controls.email.setErrors({
        ...(this.userForm.controls.email.errors ?? {}),
        duplicateEmail: true,
      });
      this.userForm.controls.email.markAsTouched();
    }
    if (message.includes('role')) {
      this.userForm.controls.roleId.setErrors({
        ...(this.userForm.controls.roleId.errors ?? {}),
        invalidRole: true,
      });
      this.userForm.controls.roleId.markAsTouched();
    }
  }

  private errorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (typeof body === 'string') {
      return body;
    }
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      return String(record['message'] ?? record['error'] ?? record['detail'] ?? error.message);
    }
    return error.message;
  }
}
