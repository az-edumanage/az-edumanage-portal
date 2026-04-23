import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantStudentCreateDataService } from '../data-access/tenant-student-create-data.service';
import { TenantStudentCreatePayload } from '../models/tenant-student-create.models';
import { TenantStudentCreateStore } from './tenant-student-create.store';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(TenantStudentCreateStore);
  private readonly data = inject(TenantStudentCreateDataService);

  private isSuccess = false;
  private readonly taskId = 'create-student-task';

  readonly isSubmitting = this.store.isSubmitting;

  readonly studentForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    birthDate: [''],
    gender: ['Male'],
    parentName: ['', Validators.required],
    parentPhone: ['', Validators.required],
    address: [''],
    grade: ['Grade 10', Validators.required],
    enrollmentType: ['Full-time'],
    isActive: [true],
    notifyParent: [true],
    notifySMS: [false],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask?.data) {
      this.studentForm.patchValue(savedTask.data as Partial<TenantStudentCreatePayload>);
      this.taskService.removeTask(this.taskId);
    }
  }

  onDestroy(): void {
    const value = this.studentForm.getRawValue();
    const hasData = value.fullName !== '' || value.email !== '' || value.parentName !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Enrolling Student: ${value.fullName || 'New Student'}`,
        route: '/tenant/students/create',
        data: value,
      });
    }
  }

  resetForm(): void {
    this.studentForm.reset(this.data.getDefaultFormValue());
    this.taskService.removeTask(this.taskId);
  }

  cancelDraft(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.studentForm.getRawValue() as TenantStudentCreatePayload;

    this.data
      .enrollStudent(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.router.navigate(['/tenant/students']);
      });
  }
}
