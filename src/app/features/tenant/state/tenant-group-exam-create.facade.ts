import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupExamCreateDataService } from '../data-access/tenant-group-exam-create-data.service';
import { TenantGroupExamCreatePayload } from '../models/tenant-group-exam-create.models';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGroupExamCreateDataService);
  private readonly store = inject(TenantGroupExamCreateStore);

  private isSuccess = false;

  readonly groupId = this.store.groupId;
  readonly isSubmitting = this.store.isSubmitting;

  readonly examForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    duration: [60, [Validators.required, Validators.min(1)]],
    instructions: [''],
    saveToCenterBank: [true],
    saveToMyMedia: [true],
    shuffleQuestions: [true],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  initialize(groupId: string | null): void {
    this.store.setGroupId(groupId);

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.examForm.patchValue(savedTask.data as Partial<TenantGroupExamCreatePayload>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.examForm.getRawValue();
    const hasData = value.title !== '' || value.instructions !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Creating Exam: ${value.title || 'New Exam'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/tenant/groups', this.groupId()]);
  }

  onSubmit(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.examForm.getRawValue() as TenantGroupExamCreatePayload;
    this.data
      .createGroupExam(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/groups', this.groupId()]);
      });
  }
}
