import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateStore {
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly teacherId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.teacherId());

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setTeacherId(value: string | null): void {
    this.teacherId.set(value);
  }
}
