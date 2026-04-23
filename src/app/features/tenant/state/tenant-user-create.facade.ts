import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { TenantUserCreateDataService } from '../data-access/tenant-user-create-data.service';
import { TenantUserCreateForm } from '../models/tenant-user-create.models';
import { TenantUserCreateStore } from './tenant-user-create.store';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantUserCreateDataService);
  private readonly store = inject(TenantUserCreateStore);

  private isSuccess = false;

  readonly roles = this.data.roles;
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
    role: ['Staff', [Validators.required]],
    status: ['Pending', [Validators.required]],
    sendInvite: [true],
    password: [''],
  });

  get isSubmitting(): boolean {
    return this.store.isSubmitting();
  }

  initialize(): void {
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.userForm.patchValue(savedTask.data as Partial<TenantUserCreateForm>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(): void {
    const value = this.userForm.getRawValue();
    const hasData = Object.values(value).some(
      (item) =>
        item !== '' && item !== null && item !== true && item !== 'Staff' && item !== 'Pending',
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
      role: 'Staff',
      status: 'Pending',
      sendInvite: true,
      password: '',
      fullName: '',
      email: '',
    });
    this.taskService.removeTask(this.store.taskId());
  }

  goBack(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.location.back();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);

    this.data
      .createUser(this.userForm.getRawValue() as TenantUserCreateForm)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
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
}
