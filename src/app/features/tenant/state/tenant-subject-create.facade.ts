import { Injectable, computed, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubjectCreateForm } from '../models/tenant-subjects.models';
import { TenantSubjectCreateStore } from './tenant-subject-create.store';

@Injectable({ providedIn: 'root' })
export class TenantSubjectCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly store = inject(TenantSubjectCreateStore);

  private returnUrl: string | null = null;
  private readonly pendingCreatedSubjectTaskId = 'create-group-pending-subject';

  readonly isSubmitting = this.store.isSubmitting;
  readonly saveError = this.store.saveError;
  readonly stages = this.store.stages;
  readonly filteredGrades = this.store.filteredGrades;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;
  readonly isEditMode = computed(() => Boolean(this.store.editingSubjectId()));

  readonly subjectForm = this.fb.group({
    stageId: ['', Validators.required],
    gradeId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  async initialize(
    subjectIdOrReturnUrl: string | null = null,
    returnUrl: string | null = null,
    preferredStageId: string | null = null,
    preferredGradeId: string | null = null,
  ): Promise<void> {
    const oldCreateSignature = subjectIdOrReturnUrl?.startsWith('/tenant/') ?? false;
    const subjectId = oldCreateSignature ? null : subjectIdOrReturnUrl;
    const selectedReturnUrl = oldCreateSignature ? subjectIdOrReturnUrl : returnUrl;
    const selectedStageId = oldCreateSignature ? returnUrl : preferredStageId;
    const selectedGradeId = oldCreateSignature ? preferredStageId : preferredGradeId;
    this.store.editingSubjectId.set(subjectId);
    this.returnUrl = selectedReturnUrl === '/tenant/groups/create' ? selectedReturnUrl : null;
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
      if (subjectId) {
        const subject = await this.data.getSubjectDetails(subjectId);
        this.store.selectedStageId.set(subject.stageId);
        this.subjectForm.patchValue({
          stageId: subject.stageId,
          gradeId: subject.gradeId,
          name: subject.name,
        }, { emitEvent: false });
      } else {
        this.applyPreferredClassification(selectedStageId, selectedGradeId);
      }
    } catch (error) {
      this.store.loadError.set(this.data.toUserMessage(error, 'Unable to load subject form options. Please try again.'));
      this.subjectForm.disable({ emitEvent: false });
    } finally {
      this.store.loading.set(false);
    }
  }

  private applyPreferredClassification(stageId: string | null, gradeId: string | null): void {
    const nextStageId = stageId && this.stages().some((stage) => stage.value === stageId) ? stageId : '';
    const nextGradeId = nextStageId && gradeId && this.store.grades().some((grade) => grade.value === gradeId && grade.stageId === nextStageId)
      ? gradeId
      : '';

    this.store.selectedStageId.set(nextStageId);
    this.subjectForm.patchValue({
      stageId: nextStageId,
      gradeId: nextGradeId,
    }, { emitEvent: false });
  }

  onStageChange(stageId: string): void {
    this.store.selectedStageId.set(stageId);
    const gradeId = this.subjectForm.controls.gradeId.value;
    if (gradeId && !this.store.filteredGrades().some((grade) => grade.value === gradeId)) {
      this.subjectForm.controls.gradeId.setValue('');
    }
  }

  resetForm(): void {
    if (this.isEditMode()) {
      void this.initialize(this.store.editingSubjectId(), this.returnUrl);
      return;
    }
    this.subjectForm.reset({
      stageId: '',
      gradeId: '',
      name: '',
    });
    this.store.selectedStageId.set('');
    this.store.saveError.set(null);
  }

  async cancel(): Promise<void> {
    if (this.returnUrl) {
      await this.router.navigateByUrl(this.returnUrl);
      return;
    }

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
      const subjectId = this.store.editingSubjectId();
      const payload = this.subjectForm.getRawValue() as TenantSubjectCreateForm;
      const savedSubject = subjectId
        ? await this.data.updateSubject(subjectId, payload)
        : await this.data.createSubject(payload);
      if (this.returnUrl) {
        this.taskService.addTask({
          id: this.pendingCreatedSubjectTaskId,
          type: 'selection',
          label: 'Created Subject: ' + savedSubject.name,
          route: this.returnUrl,
          data: {
            id: savedSubject.id,
            name: savedSubject.name,
            stageId: savedSubject.stageId,
            gradeId: savedSubject.gradeId,
          },
        });
      }
      if (!subjectId) {
        this.resetForm();
      }
      if (this.returnUrl) {
        await this.router.navigateByUrl(this.returnUrl);
        return;
      }
      await this.router.navigate(['/tenant/subjects']);
    } catch (error) {
      this.store.saveError.set(this.data.toUserMessage(error, this.isEditMode() ? 'Unable to update subject. Please try again.' : 'Unable to create subject. Please try again.'));
    } finally {
      this.store.isSubmitting.set(false);
    }
  }
}
