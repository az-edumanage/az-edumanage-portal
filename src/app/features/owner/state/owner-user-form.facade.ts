import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { OwnerUserFormDataService } from '../data-access/owner-user-form-data.service';
import { OwnerUserFormValue } from '../models/owner-user-form.models';
import { OwnerUserFormStore } from './owner-user-form.store';

@Injectable({ providedIn: 'root' })
export class OwnerUserFormFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(OwnerUserFormDataService);
  private readonly store = inject(OwnerUserFormStore);

  private isSuccess = false;

  readonly isEditMode = this.store.isEditMode;

  readonly userForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['Support Agent', Validators.required],
    requireMfa: [false],
    expiryDate: [''],
    ipRestriction: [''],
  });

  initialize(userId: string | null): void {
    this.store.setUserId(userId);

    const editSeed = this.data.getUserById(userId);
    if (editSeed) {
      this.userForm.patchValue(editSeed);
    }

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.userForm.patchValue(savedTask.data as Partial<OwnerUserFormValue>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.userForm.getRawValue();
    const hasData = value.fullName !== '' || value.email !== '';

    if (hasData && !this.isSuccess) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Creating'} User: ${value.fullName || 'New User'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/owner/users']);
  }

  getPermissionsForRole(role: string): string[] {
    return this.data.getPermissionsForRole(role);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.data
      .saveUser(this.userForm.getRawValue() as OwnerUserFormValue)
      .pipe(finalize(() => void 0))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/owner/users']);
      });
  }
}
