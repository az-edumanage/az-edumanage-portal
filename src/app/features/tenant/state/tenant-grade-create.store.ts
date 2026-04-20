import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateStore {
  readonly isSubmitting = signal(false);
  readonly taskId = signal('create-grade-task');

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
