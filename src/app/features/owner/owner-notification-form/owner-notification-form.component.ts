import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-notification-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-notification-form.component.html',
  styleUrl: './owner-notification-form.component.css'})
export class OwnerNotificationFormComponent implements OnInit, OnDestroy {
  private fb = new FormBuilder();
  private router = inject(Router);
  private taskService = inject(TaskService);

  private isSuccess = false;
  private taskId = 'create-notification-task';

  notificationForm = this.fb.group({
    title: ['', Validators.required],
    message: ['', Validators.required],
    type: ['Announcement'],
    priority: ['Medium'],
    targetType: ['all'],
    scheduleType: ['now']
  });

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.notificationForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.notificationForm.value;
    const hasData = value.title !== '' || value.message !== '';
    
    if (hasData && !this.isSuccess) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Drafting Notification: ${value.title || 'New Notification'}`,
        route: '/owner/notifications/create',
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/notifications']);
  }

  onSave() {
    if (this.notificationForm.valid) {
      console.log('Saving notification:', this.notificationForm.value);
      this.isSuccess = true;
      this.taskService.removeTask(this.taskId);
      this.router.navigate(['/owner/notifications']);
    }
  }
}
