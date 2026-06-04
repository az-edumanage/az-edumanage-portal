import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantStudentCreateDataService } from '../data-access/tenant-student-create-data.service';
import { TenantStudentCreatePayload } from '../models/tenant-student-create.models';
import { TenantStudentCreateStore } from './tenant-student-create.store';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(TenantStudentCreateStore);
  private readonly data = inject(TenantStudentCreateDataService);

  private isSuccess = false;
  private readonly taskId = 'create-student-task';
  private selectorsBound = false;

  readonly isSubmitting = this.store.isSubmitting;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly stages = this.store.stages;
  readonly universities = this.store.universities;
  readonly availableGrades = this.store.availableGrades;
  readonly availableColleges = this.store.availableColleges;

  readonly studentForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    birthDate: ['', Validators.required],
    gender: ['Male', Validators.required],
    parentName: [''],
    parentPhone: [''],
    address: [''],
    notifyParent: [true],
    educationCategory: ['BASIC_EDUCATION', Validators.required],
    stageIds: [[] as string[]],
    gradeIds: [[] as string[]],
    universityIds: [[] as string[]],
    collegeIds: [[] as string[]],
  });

  initialize(): void {
    this.isSuccess = false;
    this.store.setError(null);
    this.bindDependentSelectors();
    this.loadLookups();

    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask?.data) {
      this.studentForm.patchValue(savedTask.data as Partial<TenantStudentCreatePayload>, { emitEvent: false });
      this.syncSelectedSignals();
      this.taskService.removeTask(this.taskId);
    }
  }

  onDestroy(): void {
    const value = this.studentForm.getRawValue();
    const hasData = value.fullName !== '' || value.email !== '' || value.phone !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Enrolling Student: ${value.fullName || 'New Student'}`,
        route: '/tenant/students/create',
        data: value,
      });
    }
  }

  resetForm(): void {
    this.studentForm.reset(this.data.getDefaultFormValue());
    this.store.resetFormState();
    this.syncSelectedSignals();
    this.taskService.removeTask(this.taskId);
  }

  cancelDraft(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
  }

  onSubmit(): void {
    this.applyEducationValidators();
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    this.store.setError(null);
    const payload = this.studentForm.getRawValue() as TenantStudentCreatePayload;

    this.data
      .enrollStudent(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.taskService.removeTask(this.taskId);
          this.router.navigate(['/tenant/students']);
        },
        error: (error: Error) => this.store.setError(error.message),
      });
  }

  private loadLookups(): void {
    this.store.setLoading(true);
    this.data
      .loadLookups()
      .pipe(finalize(() => this.store.setLoading(false)))
      .subscribe({
        next: (lookups) => {
          this.store.setLookups(
            lookups.stages,
            lookups.grades,
            lookups.universities,
            lookups.colleges,
          );
        },
        error: (error: Error) => this.store.setError(error.message),
      });
  }

  private bindDependentSelectors(): void {
    if (this.selectorsBound) {
      return;
    }
    this.selectorsBound = true;

    this.studentForm.controls.stageIds.valueChanges.subscribe((stageIds) => {
      this.store.setSelectedStageIds(stageIds ?? []);
      const allowedGradeIds = new Set(this.store.availableGrades().map((grade) => grade.id));
      const nextGradeIds = (this.studentForm.controls.gradeIds.value ?? []).filter((id) => allowedGradeIds.has(id));
      if (nextGradeIds.length !== (this.studentForm.controls.gradeIds.value ?? []).length) {
        this.studentForm.controls.gradeIds.setValue(nextGradeIds);
      }
    });

    this.studentForm.controls.gradeIds.valueChanges.subscribe((gradeIds) => {
      this.store.setSelectedGradeIds(gradeIds ?? []);
    });

    this.studentForm.controls.universityIds.valueChanges.subscribe((universityIds) => {
      this.store.setSelectedUniversityIds(universityIds ?? []);
      const allowedCollegeIds = new Set(this.store.availableColleges().map((college) => college.id));
      const nextCollegeIds = (this.studentForm.controls.collegeIds.value ?? []).filter((id) => allowedCollegeIds.has(id));
      if (nextCollegeIds.length !== (this.studentForm.controls.collegeIds.value ?? []).length) {
        this.studentForm.controls.collegeIds.setValue(nextCollegeIds);
      }
    });

    this.studentForm.controls.collegeIds.valueChanges.subscribe((collegeIds) => {
      this.store.setSelectedCollegeIds(collegeIds ?? []);
    });

    this.studentForm.controls.educationCategory.valueChanges.subscribe((category) => {
      if (category === 'BASIC_EDUCATION') {
        this.studentForm.controls.universityIds.setValue([]);
        this.studentForm.controls.collegeIds.setValue([]);
      } else if (category === 'UNIVERSITY_EDUCATION') {
        this.studentForm.controls.stageIds.setValue([]);
        this.studentForm.controls.gradeIds.setValue([]);
      }
      this.applyEducationValidators();
    });
  }

  private syncSelectedSignals(): void {
    this.store.setSelectedStageIds(this.studentForm.controls.stageIds.value ?? []);
    this.store.setSelectedGradeIds(this.studentForm.controls.gradeIds.value ?? []);
    this.store.setSelectedUniversityIds(this.studentForm.controls.universityIds.value ?? []);
    this.store.setSelectedCollegeIds(this.studentForm.controls.collegeIds.value ?? []);
  }

  private applyEducationValidators(): void {
    const isBasic = this.studentForm.controls.educationCategory.value === 'BASIC_EDUCATION';
    const isUniversity = this.studentForm.controls.educationCategory.value === 'UNIVERSITY_EDUCATION';
    const basicValidators = isBasic ? [Validators.required] : [];
    const universityValidators = isUniversity ? [Validators.required] : [];
    this.studentForm.controls.stageIds.setValidators(basicValidators);
    this.studentForm.controls.gradeIds.setValidators(basicValidators);
    this.studentForm.controls.universityIds.setValidators(universityValidators);
    this.studentForm.controls.collegeIds.setValidators(universityValidators);
    this.studentForm.controls.stageIds.updateValueAndValidity({ emitEvent: false });
    this.studentForm.controls.gradeIds.updateValueAndValidity({ emitEvent: false });
    this.studentForm.controls.universityIds.updateValueAndValidity({ emitEvent: false });
    this.studentForm.controls.collegeIds.updateValueAndValidity({ emitEvent: false });
  }
}
