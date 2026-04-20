import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateStore {
  readonly groupId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly taskId = signal('');

  setGroupId(groupId: string | null): void {
    this.groupId.set(groupId);
    this.taskId.set(`create-exam-group-${groupId}`);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
