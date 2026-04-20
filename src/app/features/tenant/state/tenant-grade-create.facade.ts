import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGradeCreateDataService } from '../data-access/tenant-grade-create-data.service';
import { TenantGradeCreateStore } from './tenant-grade-create.store';
import { TenantGradeCreateForm } from '../models/tenant-grade-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGradeCreateDataService);
  private readonly store = inject(TenantGradeCreateStore);

  private isSuccess = false;

  readonly isSubmitting = this.store.isSubmitting;

  readonly gradeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    level: ['Secondary', Validators.required],
    description: [''],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.gradeForm.patchValue(savedTask.data as Partial<TenantGradeCreateForm>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(): void {
    const value = this.gradeForm.getRawValue();
    const hasData = value.name !== '' || value.description !== '' || value.level !== 'Secondary';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Creating Grade: ${value.name || 'New Grade'}`,
        route: '/tenant/grades/create',
        data: value,
      });
    }
  }

  resetForm(): void {
    if (!confirm('Are you sure you want to clear all fields?')) {
      return;
    }

    this.gradeForm.reset({ level: 'Secondary' });
    this.taskService.removeTask(this.store.taskId());
  }

  goBack(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.location.back();
  }

  onSubmit(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);

    this.data
      .createGrade(this.gradeForm.getRawValue() as TenantGradeCreateForm)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/grades']);
      });
  }
}
