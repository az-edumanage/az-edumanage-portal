import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateStore {
  readonly isSubmitting = signal(false);
  readonly taskId = signal('create-user-task');

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
