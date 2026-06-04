import { Injectable, computed, signal } from '@angular/core';
import {
  TenantTeacherLookupGrade,
  TenantTeacherLookupStage,
  TenantTeacherLookupSubject,
  TenantTeacherLookupCollege,
  TenantTeacherLookupUniversity,
  TenantTeacherLookupUniversitySubject,
} from '../models/tenant-teacher-create.models';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateStore {
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly teacherId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.teacherId());

  readonly stages = signal<TenantTeacherLookupStage[]>([]);
  readonly grades = signal<TenantTeacherLookupGrade[]>([]);
  readonly subjects = signal<TenantTeacherLookupSubject[]>([]);
  readonly universities = signal<TenantTeacherLookupUniversity[]>([]);
  readonly colleges = signal<TenantTeacherLookupCollege[]>([]);
  readonly universitySubjects = signal<TenantTeacherLookupUniversitySubject[]>([]);

  readonly selectedStageIds = signal<string[]>([]);
  readonly selectedGradeIds = signal<string[]>([]);
  readonly selectedSubjectIds = signal<string[]>([]);
  readonly selectedUniversityIds = signal<string[]>([]);
  readonly selectedCollegeIds = signal<string[]>([]);
  readonly selectedUniversitySubjectIds = signal<string[]>([]);

  readonly availableGrades = computed(() => {
    const stageIds = new Set(this.selectedStageIds());
    return this.grades().filter((grade) => stageIds.has(grade.stageId));
  });

  readonly availableSubjects = computed(() => {
    const gradeIds = new Set(this.selectedGradeIds());
    return this.subjects().filter((subject) => gradeIds.has(subject.gradeId));
  });

  readonly availableColleges = computed(() => {
    const universityIds = new Set(this.selectedUniversityIds());
    return this.colleges().filter((college) => universityIds.has(college.universityId));
  });

  readonly availableUniversitySubjects = computed(() => {
    const collegeIds = new Set(this.selectedCollegeIds());
    return this.universitySubjects().filter((subject) => collegeIds.has(subject.collegeId));
  });

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  setTeacherId(value: string | null): void {
    this.teacherId.set(value);
  }

  setLookups(
      stages: TenantTeacherLookupStage[],
      grades: TenantTeacherLookupGrade[],
      subjects: TenantTeacherLookupSubject[],
      universities: TenantTeacherLookupUniversity[],
      colleges: TenantTeacherLookupCollege[],
      universitySubjects: TenantTeacherLookupUniversitySubject[],
  ): void {
    this.stages.set(stages);
    this.grades.set(grades);
    this.subjects.set(subjects);
    this.universities.set(universities);
    this.colleges.set(colleges);
    this.universitySubjects.set(universitySubjects);
  }

  setSelectedStageIds(value: string[]): void {
    this.selectedStageIds.set(value);
  }

  setSelectedGradeIds(value: string[]): void {
    this.selectedGradeIds.set(value);
  }

  setSelectedSubjectIds(value: string[]): void {
    this.selectedSubjectIds.set(value);
  }

  setSelectedUniversityIds(value: string[]): void {
    this.selectedUniversityIds.set(value);
  }

  setSelectedCollegeIds(value: string[]): void {
    this.selectedCollegeIds.set(value);
  }

  setSelectedUniversitySubjectIds(value: string[]): void {
    this.selectedUniversitySubjectIds.set(value);
  }

  setError(message: string | null): void {
    this.errorMessage.set(message);
  }

  resetFormState(): void {
    this.setSubmitting(false);
    this.setLoading(false);
    this.setError(null);
    this.showPassword.set(false);
    this.setSelectedStageIds([]);
    this.setSelectedGradeIds([]);
    this.setSelectedSubjectIds([]);
    this.setSelectedUniversityIds([]);
    this.setSelectedCollegeIds([]);
    this.setSelectedUniversitySubjectIds([]);
  }
}
