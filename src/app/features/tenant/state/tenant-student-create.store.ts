import { Injectable, computed, signal } from '@angular/core';
import {
  TenantStudentLookupCollege,
  TenantStudentLookupGrade,
  TenantStudentLookupStage,
  TenantStudentLookupUniversity,
} from '../models/tenant-student-create.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateStore {
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly stages = signal<TenantStudentLookupStage[]>([]);
  readonly grades = signal<TenantStudentLookupGrade[]>([]);
  readonly universities = signal<TenantStudentLookupUniversity[]>([]);
  readonly colleges = signal<TenantStudentLookupCollege[]>([]);

  readonly selectedStageIds = signal<string[]>([]);
  readonly selectedGradeIds = signal<string[]>([]);
  readonly selectedUniversityIds = signal<string[]>([]);
  readonly selectedCollegeIds = signal<string[]>([]);

  readonly availableGrades = computed(() => {
    const stageIds = new Set(this.selectedStageIds());
    return this.grades().filter((grade) => stageIds.has(grade.stageId));
  });

  readonly availableColleges = computed(() => {
    const universityIds = new Set(this.selectedUniversityIds());
    return this.colleges().filter((college) => universityIds.has(college.universityId));
  });

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  setLookups(
      stages: TenantStudentLookupStage[],
      grades: TenantStudentLookupGrade[],
      universities: TenantStudentLookupUniversity[],
      colleges: TenantStudentLookupCollege[],
  ): void {
    this.stages.set(stages);
    this.grades.set(grades);
    this.universities.set(universities);
    this.colleges.set(colleges);
  }

  setSelectedStageIds(value: string[]): void {
    this.selectedStageIds.set(value);
  }

  setSelectedGradeIds(value: string[]): void {
    this.selectedGradeIds.set(value);
  }

  setSelectedUniversityIds(value: string[]): void {
    this.selectedUniversityIds.set(value);
  }

  setSelectedCollegeIds(value: string[]): void {
    this.selectedCollegeIds.set(value);
  }

  setError(message: string | null): void {
    this.errorMessage.set(message);
  }

  resetFormState(): void {
    this.setSubmitting(false);
    this.setLoading(false);
    this.setError(null);
    this.setSelectedStageIds([]);
    this.setSelectedGradeIds([]);
    this.setSelectedUniversityIds([]);
    this.setSelectedCollegeIds([]);
  }
}
