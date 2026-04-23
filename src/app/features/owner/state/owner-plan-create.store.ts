import { Injectable, computed, signal } from '@angular/core';

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

  readonly taskId = signal('create-plan-task');

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
}
