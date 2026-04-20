import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantTeacherCreateDataService } from '../data-access/tenant-teacher-create-data.service';
import { TenantTeacherCreatePayload } from '../models/tenant-teacher-create.models';
import { TenantTeacherCreateStore } from './tenant-teacher-create.store';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(TenantTeacherCreateStore);
  private readonly data = inject(TenantTeacherCreateDataService);

  private isSuccess = false;
  private taskId = 'create-teacher-task';

  readonly isSubmitting = this.store.isSubmitting;
  readonly showPassword = this.store.showPassword;
  readonly teacherId = this.store.teacherId;
  readonly isEditMode = this.store.isEditMode;

  readonly teacherForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    subject: ['Physics', Validators.required],
    qualification: [''],
    password: ['Teacher123!', [Validators.required, Validators.minLength(8)]],
    forcePasswordChange: [true],
    status: ['Active'],
    joinDate: [new Date().toISOString().split('T')[0]],
    canManageAttendance: [true],
    canManageExams: [true],
    canMessageStudents: [true],
    sendWelcomeEmail: [true],
  });

  initialize(teacherId: string | null): void {
    this.store.setTeacherId(teacherId);

    if (teacherId) {
      this.taskId = `edit-teacher-${teacherId}`;
      this.teacherForm.patchValue(this.data.getTeacherForEdit(teacherId));
      this.teacherForm.get('password')?.clearValidators();
      this.teacherForm.get('password')?.updateValueAndValidity();
    } else {
      this.taskId = 'create-teacher-task';
      this.teacherForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.teacherForm.get('password')?.updateValueAndValidity();
    }

    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask?.data) {
      this.teacherForm.patchValue(savedTask.data as Partial<TenantTeacherCreatePayload>);
      this.taskService.removeTask(this.taskId);
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.teacherForm.getRawValue();
    const hasData = value.fullName !== '' || value.email !== '' || value.phone !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Adding'} Teacher: ${value.fullName || 'New Teacher'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  resetForm(): void {
    this.teacherForm.reset(this.data.getDefaultFormValue());
    this.taskService.removeTask(this.taskId);
  }

  cancelDraft(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
  }

  onSubmit(): void {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.teacherForm.getRawValue() as TenantTeacherCreatePayload;

    this.data
      .createOrUpdateTeacher(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.router.navigate(['/tenant/teachers']);
      });
  }
}
