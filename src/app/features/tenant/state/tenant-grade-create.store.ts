import { Injectable, signal } from '@angular/core';
import { TenantGradeAcademicLevelOption, TenantGradeCountryOption } from '../models/tenant-grade-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateStore {
  readonly isSubmitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly countryOptions = signal<TenantGradeCountryOption[]>([]);
  readonly academicLevelOptions = signal<TenantGradeAcademicLevelOption[]>([]);
  readonly countriesLoading = signal(false);
  readonly countryCreating = signal(false);
  readonly levelsLoading = signal(false);
  readonly countriesError = signal<string | null>(null);
  readonly countryCreateError = signal<string | null>(null);
  readonly levelsError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly currentGradeId = signal<string | null>(null);
  readonly taskId = signal('create-grade-task');

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setEditMode(gradeId: string | null): void {
    this.currentGradeId.set(gradeId);
    this.isEditMode.set(gradeId !== null);
    this.taskId.set(gradeId ? `edit-grade-task-${gradeId}` : 'create-grade-task');
  }
}
