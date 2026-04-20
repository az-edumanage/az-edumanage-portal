import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerUserFormStore {
  readonly isEditMode = signal(false);
  readonly userId = signal<string | null>(null);

  readonly taskId = computed(() => {
    if (this.isEditMode() && this.userId()) {
      return `edit-user-task-${this.userId()}`;
    }

    return 'create-owner-user-task';
  });

  setUserId(userId: string | null): void {
    this.userId.set(userId);
    this.isEditMode.set(!!userId);
  }
}
