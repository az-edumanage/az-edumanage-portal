import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubjectCreateForm } from '../models/tenant-subjects.models';
import { TenantSubjectCreateStore } from './tenant-subject-create.store';

@Injectable({ providedIn: 'root' })
export class TenantSubjectCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly store = inject(TenantSubjectCreateStore);

  readonly isSubmitting = this.store.isSubmitting;
  readonly saveError = this.store.saveError;
  readonly stages = this.store.stages;
  readonly filteredGrades = this.store.filteredGrades;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;

  readonly subjectForm = this.fb.group({
    stageId: ['', Validators.required],
    gradeId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  async initialize(): Promise<void> {
    this.store.loadError.set(null);
    this.store.saveError.set(null);
    this.subjectForm.enable({ emitEvent: false });
    this.subjectForm.reset({
      stageId: '',
      gradeId: '',
      name: '',
    }, { emitEvent: false });

    this.store.loading.set(true);
    try {
      const [stages, grades] = await Promise.all([
        this.data.listStageOptions(),
        this.data.listGradeOptions(),
      ]);
      this.store.stages.set(stages);
      this.store.grades.set(grades);
    } catch (error) {
      this.store.loadError.set(this.data.toUserMessage(error, 'Unable to load subject form options. Please try again.'));
      this.subjectForm.disable({ emitEvent: false });
    } finally {
      this.store.loading.set(false);
    }
  }

  onStageChange(stageId: string): void {
    this.store.selectedStageId.set(stageId);
    const gradeId = this.subjectForm.controls.gradeId.value;
    if (gradeId && !this.store.filteredGrades().some((grade) => grade.value === gradeId)) {
      this.subjectForm.controls.gradeId.setValue('');
    }
  }

  resetForm(): void {
    this.subjectForm.reset({
      stageId: '',
      gradeId: '',
      name: '',
    });
    this.store.selectedStageId.set('');
    this.store.saveError.set(null);
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/tenant/subjects']);
  }

  async submit(): Promise<void> {
    if (this.subjectForm.invalid || this.isSubmitting()) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.store.isSubmitting.set(true);
    this.store.saveError.set(null);
    try {
      await this.data.createSubject(this.subjectForm.getRawValue() as TenantSubjectCreateForm);
      this.resetForm();
      await this.router.navigate(['/tenant/subjects']);
    } catch (error) {
      this.store.saveError.set(this.data.toUserMessage(error, 'Unable to create subject. Please try again.'));
    } finally {
      this.store.isSubmitting.set(false);
    }
  }
}
