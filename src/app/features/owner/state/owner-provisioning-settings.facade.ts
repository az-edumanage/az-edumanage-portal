import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { OwnerProvisioningSettingsDataService } from '../data-access/owner-provisioning-settings-data.service';
import { OwnerProvisioningSettingsStore } from './owner-provisioning-settings.store';
import { OwnerProvisioningSettingsFormValue } from '../models/owner-provisioning-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningSettingsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly data = inject(OwnerProvisioningSettingsDataService);
  private readonly store = inject(OwnerProvisioningSettingsStore);

  private isSuccess = false;

  readonly settingsForm = this.fb.group({
    dbStrategy: ['schema', Validators.required],
    dbRegion: [''],
    defaultPlan: ['starter', Validators.required],
    defaultTrialDays: [14, [Validators.required, Validators.min(0)]],
    autoActivate: [true],
    enableAdvancedInTrial: [true],
    trialModExams: [true],
    trialModFinance: [false],
    trialModAnalytics: [false],
    createDefaultRoles: [true],
    createAcademicYear: [true],
    setupNotifTemplates: [true],
    createPaymentCustomer: [true],
    sendWelcomeEmail: [true],
    allocateStorage: [true],
    maxRetries: [3, [Validators.required, Validators.min(0)]],
    retryInterval: [30, [Validators.required, Validators.min(1)]],
    notifyAdmin: [true],
    rollbackOnFailure: [true],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.settingsForm.patchValue(savedTask.data as Partial<OwnerProvisioningSettingsFormValue>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(): void {
    if (this.settingsForm.dirty && !this.isSuccess) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: 'Editing Provisioning Settings',
        route: '/owner/provisioning/settings',
        data: this.settingsForm.getRawValue(),
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/owner/provisioning']);
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.data
      .saveSettings(this.settingsForm.getRawValue() as OwnerProvisioningSettingsFormValue)
      .pipe(finalize(() => void 0))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/owner/provisioning']);
      });
  }
}
