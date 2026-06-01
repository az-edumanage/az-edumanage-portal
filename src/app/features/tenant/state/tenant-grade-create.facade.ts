import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TenantGradeCreateDataService } from '../data-access/tenant-grade-create-data.service';
import { TenantGradeCreateForm } from '../models/tenant-grade-create.models';
import { TenantGradeCreateStore } from './tenant-grade-create.store';

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGradeCreateDataService);
  private readonly store = inject(TenantGradeCreateStore);

  private isSuccess = false;

  readonly isSubmitting = this.store.isSubmitting;
  readonly saveError = this.store.saveError;
  readonly countryOptions = this.store.countryOptions;
  readonly academicLevelOptions = this.store.academicLevelOptions;
  readonly countriesLoading = this.store.countriesLoading;
  readonly levelsLoading = this.store.levelsLoading;
  readonly countriesError = this.store.countriesError;
  readonly levelsError = this.store.levelsError;
  readonly loadError = this.store.loadError;
  readonly isEditMode = this.store.isEditMode;
  readonly currentGradeId = this.store.currentGradeId;

  readonly gradeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    countryId: ['', Validators.required],
    stageId: ['', Validators.required],
    description: [''],
  });

  async initialize(gradeId: string | null = null): Promise<void> {
    this.isSuccess = false;
    this.store.setEditMode(gradeId);
    this.store.loadError.set(null);
    this.store.saveError.set(null);
    this.gradeForm.enable({ emitEvent: false });
    await this.loadCountries();

    if (gradeId) {
      await this.loadGradeForEdit(gradeId);
      return;
    }

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.gradeForm.patchValue(savedTask.data as Partial<TenantGradeCreateForm>);
      this.taskService.removeTask(this.store.taskId());
    }

    const currentCountryId = this.gradeForm.controls.countryId.value || this.countryOptions()[0]?.value || '';
    if (currentCountryId) {
      this.gradeForm.controls.countryId.setValue(currentCountryId, { emitEvent: false });
      await this.loadAcademicLevels(currentCountryId, this.gradeForm.controls.stageId.value || '');
    }
  }

  onDestroy(): void {
    const value = this.gradeForm.getRawValue();
    const hasData = value.name !== '' || value.description !== '' || value.countryId !== '' || value.stageId !== '';

    if (!this.isEditMode() && hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Creating Grade: ${value.name || 'New Grade'}`,
        route: '/tenant/grades/create',
        data: value,
      });
    }
  }

  async onCountryChange(countryId: string): Promise<void> {
    this.gradeForm.controls.stageId.setValue('');
    await this.loadAcademicLevels(countryId, '');
  }

  resetForm(): void {
    if (!confirm('Are you sure you want to clear all fields?')) {
      return;
    }

    const countryId = this.countryOptions()[0]?.value ?? '';
    this.gradeForm.reset({
      name: '',
      countryId,
      stageId: '',
      description: '',
    });
    this.store.saveError.set(null);
    this.taskService.removeTask(this.store.taskId());
    if (countryId) {
      void this.loadAcademicLevels(countryId, '');
    } else {
      this.store.academicLevelOptions.set([]);
    }
  }

  goBack(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.location.back();
  }

  async onSubmit(): Promise<void> {
    if (this.gradeForm.invalid || this.isSubmitting()) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    this.store.saveError.set(null);

    try {
      const payload = this.gradeForm.getRawValue() as TenantGradeCreateForm;
      const gradeId = this.store.currentGradeId();
      if (this.isEditMode() && gradeId) {
        const updated = await this.data.updateGrade(gradeId, payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        await this.router.navigate(['/tenant/grades', updated.id]);
        return;
      }

      await this.data.createGrade(payload);
      this.isSuccess = true;
      this.taskService.removeTask(this.store.taskId());
      await this.router.navigate(['/tenant/grades']);
    } catch (error) {
      this.store.saveError.set(this.data.toUserMessage(error));
    } finally {
      this.store.setSubmitting(false);
    }
  }

  private async loadGradeForEdit(gradeId: string): Promise<void> {
    try {
      const grade = await this.data.getGrade(gradeId);
      this.gradeForm.patchValue({
        name: grade.name,
        countryId: grade.countryId,
        stageId: grade.stageId,
        description: grade.description ?? '',
      }, { emitEvent: false });
      await this.loadAcademicLevels(grade.countryId, grade.stageId);
    } catch (error) {
      this.store.loadError.set(this.data.toUserMessage(error));
      this.gradeForm.disable({ emitEvent: false });
    }
  }

  private async loadCountries(): Promise<void> {
    this.store.countriesLoading.set(true);
    this.store.countriesError.set(null);
    try {
      this.store.countryOptions.set(await this.data.listCountryOptions());
    } catch (error) {
      this.store.countriesError.set(this.data.toUserMessage(error));
    } finally {
      this.store.countriesLoading.set(false);
    }
  }

  private async loadAcademicLevels(countryId: string, preferredStageId: string): Promise<void> {
    if (!countryId) {
      this.store.academicLevelOptions.set([]);
      this.gradeForm.controls.stageId.setValue('', { emitEvent: false });
      return;
    }

    this.store.levelsLoading.set(true);
    this.store.levelsError.set(null);
    try {
      const options = await this.data.listAcademicLevelOptions(countryId);
      this.store.academicLevelOptions.set(options);
      const selectedStageId = options.some((stage) => stage.value === preferredStageId)
        ? preferredStageId
        : options[0]?.value ?? '';
      this.gradeForm.controls.stageId.setValue(selectedStageId, { emitEvent: false });
    } catch (error) {
      this.store.academicLevelOptions.set([]);
      this.gradeForm.controls.stageId.setValue('', { emitEvent: false });
      this.store.levelsError.set(this.data.toUserMessage(error));
    } finally {
      this.store.levelsLoading.set(false);
    }
  }
}
