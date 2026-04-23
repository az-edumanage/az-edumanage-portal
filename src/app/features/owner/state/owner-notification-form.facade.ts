import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { OwnerNotificationFormDataService } from '../data-access/owner-notification-form-data.service';
import { OwnerNotificationFormValue } from '../models/owner-notification-form.models';
import { OwnerNotificationFormStore } from './owner-notification-form.store';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationFormFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(OwnerNotificationFormDataService);
  private readonly store = inject(OwnerNotificationFormStore);

  private isSuccess = false;

  readonly notificationForm = this.fb.group({
    title: ['', Validators.required],
    message: ['', Validators.required],
    type: ['Announcement'],
    priority: ['Medium'],
    targetType: ['all'],
    scheduleType: ['now'],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.notificationForm.patchValue(savedTask.data as Partial<OwnerNotificationFormValue>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(): void {
    const value = this.notificationForm.getRawValue();
    const hasData = value.title !== '' || value.message !== '';

    if (hasData && !this.isSuccess) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Drafting Notification: ${value.title || 'New Notification'}`,
        route: '/owner/notifications/create',
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/owner/notifications']);
  }

  onSave(): void {
    if (this.notificationForm.invalid) {
      this.notificationForm.markAllAsTouched();
      return;
    }

    this.data
      .saveNotification(this.notificationForm.getRawValue() as OwnerNotificationFormValue)
      .pipe(finalize(() => void 0))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/owner/notifications']);
      });
  }
}
