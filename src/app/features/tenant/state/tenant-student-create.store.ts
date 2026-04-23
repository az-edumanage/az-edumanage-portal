import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateStore {
  readonly isSubmitting = signal(false);

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
