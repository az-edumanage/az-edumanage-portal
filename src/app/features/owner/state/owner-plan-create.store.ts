import { Injectable, computed, signal } from '@angular/core';
import { OwnerPlanModuleOption } from '../models/owner-plan-create.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlanCreateStore {
  readonly isEditMode = signal(false);
  readonly planId = signal<string | null>(null);

  readonly showStatusDropdown = signal(false);
  readonly statusSearchQuery = signal('');

  readonly showVisibilityDropdown = signal(false);
  readonly visibilitySearchQuery = signal('');

  readonly showCurrencyDropdown = signal(false);
  readonly currencySearchQuery = signal('');

  readonly showAudienceTypeDropdown = signal(false);
  readonly audienceTypeSearchQuery = signal('');
  readonly selectedAudienceType = signal<string>('');
  readonly existingPlans = signal<{ id: string; name: string }[]>([]);
  readonly moduleOptions = signal<OwnerPlanModuleOption[]>([]);

  readonly taskId = signal('create-plan-task');
  readonly isSubmitting = signal(false);
  readonly actionStatus = signal<{ success: boolean; message: string } | null>(null);

  readonly effectiveTaskId = computed(() => {
    if (this.isEditMode() && this.planId()) {
      return `edit-plan-${this.planId()}`;
    }

    return this.taskId();
  });

  setPlanId(planId: string | null): void {
    this.planId.set(planId);
    this.isEditMode.set(!!planId);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setActionStatus(value: { success: boolean; message: string } | null): void {
    this.actionStatus.set(value);
  }
}
