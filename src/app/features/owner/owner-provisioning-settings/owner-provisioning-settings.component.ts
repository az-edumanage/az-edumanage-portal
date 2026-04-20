import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-provisioning-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-provisioning-settings.component.html'})
export class OwnerProvisioningSettingsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);
  
  settingsForm: FormGroup;
  private isSuccess = false;
  private taskId = 'provisioning-settings-task';

  constructor() {
    this.settingsForm = this.fb.group({
      // Database Strategy
      dbStrategy: ['schema', Validators.required],
      dbRegion: [''],

      // Default Plan
      defaultPlan: ['starter', Validators.required],
      defaultTrialDays: [14, [Validators.required, Validators.min(0)]],
      autoActivate: [true],

      // Modules
      enableAdvancedInTrial: [true],
      trialModExams: [true],
      trialModFinance: [false],
      trialModAnalytics: [false],

      // Initial Data
      createDefaultRoles: [true],
      createAcademicYear: [true],
      setupNotifTemplates: [true],

      // External Services
      createPaymentCustomer: [true],
      sendWelcomeEmail: [true],
      allocateStorage: [true],

      // Failure & Retry
      maxRetries: [3, [Validators.required, Validators.min(0)]],
      retryInterval: [30, [Validators.required, Validators.min(1)]],
      notifyAdmin: [true],
      rollbackOnFailure: [true]
    });
  }

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.settingsForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    // For settings, we assume "has data" is always true or check for dirty
    if (this.settingsForm.dirty && !this.isSuccess) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: 'Editing Provisioning Settings',
        route: '/owner/provisioning/settings',
        data: this.settingsForm.value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/provisioning']);
  }

  saveSettings() {
    if (this.settingsForm.valid) {
      console.log('Provisioning Settings Saved:', this.settingsForm.value);
      this.isSuccess = true;
      this.taskService.removeTask(this.taskId);
      // In a real app, call service to save settings
      this.router.navigate(['/owner/provisioning']);
    }
  }
}
