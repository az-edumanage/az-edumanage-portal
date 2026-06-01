import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantTeacherCreateDataService } from '../data-access/tenant-teacher-create-data.service';
import { TenantTeacherCreatePayload } from '../models/tenant-teacher-create.models';
import { TenantTeacherCreateStore } from './tenant-teacher-create.store';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(TenantTeacherCreateStore);
  private readonly data = inject(TenantTeacherCreateDataService);

  private isSuccess = false;
  private taskId = 'create-teacher-task';
  private selectorsBound = false;

  readonly isSubmitting = this.store.isSubmitting;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly showPassword = this.store.showPassword;
  readonly teacherId = this.store.teacherId;
  readonly isEditMode = this.store.isEditMode;
  readonly stages = this.store.stages;
  readonly universities = this.store.universities;
  readonly availableGrades = this.store.availableGrades;
  readonly availableSubjects = this.store.availableSubjects;
  readonly availableColleges = this.store.availableColleges;
  readonly availableUniversitySubjects = this.store.availableUniversitySubjects;

  readonly teacherForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    username: ['', Validators.required],
    password: ['Teacher123!', [Validators.required, Validators.minLength(8)]],
    forcePasswordChange: [true],
    educationCategory: ['BASIC_EDUCATION', Validators.required],
    stageIds: [[] as string[]],
    gradeIds: [[] as string[]],
    subjectIds: [[] as string[]],
    universityIds: [[] as string[]],
    collegeIds: [[] as string[]],
    universitySubjectIds: [[] as string[]],
    status: ['Active', Validators.required],
    joinDate: [new Date().toISOString().split('T')[0]],
    canManageAttendance: [true],
    canManageExams: [true],
    canMessageStudents: [true],
    documents: [[] as TenantTeacherCreatePayload['documents']],
  });

  initialize(teacherId: string | null): void {
    this.isSuccess = false;
    this.store.setTeacherId(teacherId);
    this.store.setError(null);
    this.configureMode(teacherId);
    this.bindDependentSelectors();

    if (!teacherId) {
      this.resetCreateForm();
    }

    this.loadLookups(teacherId);

    const savedTask = this.taskService.getTask(this.taskId);
    if (teacherId && savedTask?.data) {
      this.teacherForm.patchValue(savedTask.data as Partial<TenantTeacherCreatePayload>, { emitEvent: false });
      this.syncSelectedSignals();
      this.taskService.removeTask(this.taskId);
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.teacherForm.getRawValue();
    const hasData = value.fullName !== '' || value.email !== '' || value.phone !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Adding'} Teacher: ${value.fullName || 'New Teacher'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  resetForm(): void {
    this.resetCreateForm();
    this.taskService.removeTask(this.taskId);
  }

  cancelDraft(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
  }

  setDocuments(files: FileList | null): void {
    const documents = Array.from(files ?? []).map((file) => ({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      storagePath: file.name,
    }));
    this.teacherForm.controls.documents.setValue(documents);
  }

  onSubmit(): void {
    this.applyEducationValidators();
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    this.store.setError(null);
    const payload = this.teacherForm.getRawValue() as TenantTeacherCreatePayload;

    this.data
      .createOrUpdateTeacher(payload, this.teacherId())
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.taskService.removeTask(this.taskId);
          this.router.navigate(['/tenant/teachers']);
        },
        error: (error: Error) => this.store.setError(error.message),
      });
  }

  private configureMode(teacherId: string | null): void {
    if (teacherId) {
      this.taskId = `edit-teacher-${teacherId}`;
      this.teacherForm.controls.username.clearValidators();
      this.teacherForm.controls.username.updateValueAndValidity();
      this.teacherForm.controls.password.clearValidators();
      this.teacherForm.controls.password.updateValueAndValidity();
      return;
    }
    this.taskId = 'create-teacher-task';
    this.teacherForm.controls.username.setValidators([Validators.required]);
    this.teacherForm.controls.username.updateValueAndValidity();
    this.teacherForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.teacherForm.controls.password.updateValueAndValidity();
  }

  private resetCreateForm(): void {
    this.teacherForm.reset(this.data.getDefaultFormValue());
    this.store.resetFormState();
    this.syncSelectedSignals();
    this.taskService.removeTask('create-teacher-task');
  }

  private loadLookups(teacherId: string | null): void {
    this.store.setLoading(true);
    this.data
      .loadLookups()
      .subscribe({
        next: (lookups) => {
          this.store.setLookups(
            lookups.stages,
            lookups.grades,
            lookups.subjects,
            lookups.universities,
            lookups.colleges,
            lookups.universitySubjects,
          );
          if (teacherId) {
            this.loadTeacher(teacherId);
            return;
          }
          this.store.setLoading(false);
        },
        error: (error: Error) => {
          this.store.setLoading(false);
          this.store.setError(error.message);
        },
      });
  }

  private loadTeacher(teacherId: string): void {
    this.store.setLoading(true);
    this.data
      .getTeacherForEdit(teacherId)
      .pipe(finalize(() => this.store.setLoading(false)))
      .subscribe({
        next: (seed) => {
          this.teacherForm.patchValue(seed, { emitEvent: false });
          this.syncSelectedSignals();
        },
        error: (error: Error) => this.store.setError(error.message),
      });
  }

  private bindDependentSelectors(): void {
    if (this.selectorsBound) {
      return;
    }
    this.selectorsBound = true;

    this.teacherForm.controls.stageIds.valueChanges.subscribe((stageIds) => {
      const selectedStageIds = stageIds ?? [];
      this.store.setSelectedStageIds(selectedStageIds);
      const allowedGradeIds = new Set(this.store.availableGrades().map((grade) => grade.id));
      const nextGradeIds = (this.teacherForm.controls.gradeIds.value ?? []).filter((id) => allowedGradeIds.has(id));
      if (nextGradeIds.length !== (this.teacherForm.controls.gradeIds.value ?? []).length) {
        this.teacherForm.controls.gradeIds.setValue(nextGradeIds);
      }
    });

    this.teacherForm.controls.gradeIds.valueChanges.subscribe((gradeIds) => {
      const selectedGradeIds = gradeIds ?? [];
      this.store.setSelectedGradeIds(selectedGradeIds);
      const allowedSubjectIds = new Set(this.store.availableSubjects().map((subject) => subject.id));
      const nextSubjectIds = (this.teacherForm.controls.subjectIds.value ?? []).filter((id) => allowedSubjectIds.has(id));
      if (nextSubjectIds.length !== (this.teacherForm.controls.subjectIds.value ?? []).length) {
        this.teacherForm.controls.subjectIds.setValue(nextSubjectIds);
      }
    });

    this.teacherForm.controls.subjectIds.valueChanges.subscribe((subjectIds) => {
      this.store.setSelectedSubjectIds(subjectIds ?? []);
    });

    this.teacherForm.controls.universityIds.valueChanges.subscribe((universityIds) => {
      const selectedUniversityIds = universityIds ?? [];
      this.store.setSelectedUniversityIds(selectedUniversityIds);
      const allowedCollegeIds = new Set(this.store.availableColleges().map((college) => college.id));
      const nextCollegeIds = (this.teacherForm.controls.collegeIds.value ?? []).filter((id) => allowedCollegeIds.has(id));
      if (nextCollegeIds.length !== (this.teacherForm.controls.collegeIds.value ?? []).length) {
        this.teacherForm.controls.collegeIds.setValue(nextCollegeIds);
      }
    });

    this.teacherForm.controls.collegeIds.valueChanges.subscribe((collegeIds) => {
      const selectedCollegeIds = collegeIds ?? [];
      this.store.setSelectedCollegeIds(selectedCollegeIds);
      const allowedSubjectIds = new Set(this.store.availableUniversitySubjects().map((subject) => subject.id));
      const nextSubjectIds = (this.teacherForm.controls.universitySubjectIds.value ?? []).filter((id) => allowedSubjectIds.has(id));
      if (nextSubjectIds.length !== (this.teacherForm.controls.universitySubjectIds.value ?? []).length) {
        this.teacherForm.controls.universitySubjectIds.setValue(nextSubjectIds);
      }
    });

    this.teacherForm.controls.universitySubjectIds.valueChanges.subscribe((subjectIds) => {
      this.store.setSelectedUniversitySubjectIds(subjectIds ?? []);
    });

    this.teacherForm.controls.educationCategory.valueChanges.subscribe((category) => {
      if (category === 'BASIC_EDUCATION') {
        this.teacherForm.controls.universityIds.setValue([]);
        this.teacherForm.controls.collegeIds.setValue([]);
        this.teacherForm.controls.universitySubjectIds.setValue([]);
      } else if (category === 'UNIVERSITY_EDUCATION') {
        this.teacherForm.controls.stageIds.setValue([]);
        this.teacherForm.controls.gradeIds.setValue([]);
        this.teacherForm.controls.subjectIds.setValue([]);
      }
      this.applyEducationValidators();
    });
  }

  private syncSelectedSignals(): void {
    this.store.setSelectedStageIds(this.teacherForm.controls.stageIds.value ?? []);
    this.store.setSelectedGradeIds(this.teacherForm.controls.gradeIds.value ?? []);
    this.store.setSelectedSubjectIds(this.teacherForm.controls.subjectIds.value ?? []);
    this.store.setSelectedUniversityIds(this.teacherForm.controls.universityIds.value ?? []);
    this.store.setSelectedCollegeIds(this.teacherForm.controls.collegeIds.value ?? []);
    this.store.setSelectedUniversitySubjectIds(this.teacherForm.controls.universitySubjectIds.value ?? []);
  }

  private applyEducationValidators(): void {
    const isBasic = this.teacherForm.controls.educationCategory.value === 'BASIC_EDUCATION';
    const isUniversity = this.teacherForm.controls.educationCategory.value === 'UNIVERSITY_EDUCATION';
    const basicValidators = isBasic ? [Validators.required] : [];
    const universityValidators = isUniversity ? [Validators.required] : [];
    this.teacherForm.controls.stageIds.setValidators(basicValidators);
    this.teacherForm.controls.gradeIds.setValidators(basicValidators);
    this.teacherForm.controls.subjectIds.setValidators(basicValidators);
    this.teacherForm.controls.universityIds.setValidators(universityValidators);
    this.teacherForm.controls.collegeIds.setValidators(universityValidators);
    this.teacherForm.controls.universitySubjectIds.setValidators(universityValidators);
    this.teacherForm.controls.stageIds.updateValueAndValidity({ emitEvent: false });
    this.teacherForm.controls.gradeIds.updateValueAndValidity({ emitEvent: false });
    this.teacherForm.controls.subjectIds.updateValueAndValidity({ emitEvent: false });
    this.teacherForm.controls.universityIds.updateValueAndValidity({ emitEvent: false });
    this.teacherForm.controls.collegeIds.updateValueAndValidity({ emitEvent: false });
    this.teacherForm.controls.universitySubjectIds.updateValueAndValidity({ emitEvent: false });
  }
}
