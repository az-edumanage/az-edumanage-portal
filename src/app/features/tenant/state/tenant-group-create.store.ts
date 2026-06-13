import { Injectable, computed, signal } from '@angular/core';
import {
  RoomUnavailableRange,
  TenantGroupEducationCategory,
  TenantGroupSelectorOption,
  TeacherUnavailableRange,
} from '../models/tenant-group-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupCreateStore {
  readonly isSubmitting = signal(false);
  readonly isLoadingOptions = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoadingTeacherAvailability = signal(false);
  readonly teacherAvailabilityLoadFailed = signal(false);
  readonly teacherUnavailableRanges = signal<TeacherUnavailableRange[]>([]);
  readonly hasTeacherAvailabilityConflict = signal(false);
  readonly isLoadingRoomAvailability = signal(false);
  readonly roomAvailabilityLoadFailed = signal(false);
  readonly roomUnavailableRanges = signal<RoomUnavailableRange[]>([]);
  readonly hasRoomAvailabilityConflict = signal(false);
  readonly roomAvailabilityRevision = signal(0);
  readonly groupId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.groupId());
  readonly selectedDays = signal<string[]>([]);
  readonly educationCategory = signal<TenantGroupEducationCategory>('BASIC_EDUCATION');

  readonly owners = signal<TenantGroupSelectorOption[]>([]);
  readonly allTeachers = signal<TenantGroupSelectorOption[]>([]);
  readonly allStages = signal<TenantGroupSelectorOption[]>([]);
  readonly allGrades = signal<TenantGroupSelectorOption[]>([]);
  readonly allUniversities = signal<TenantGroupSelectorOption[]>([]);
  readonly allColleges = signal<TenantGroupSelectorOption[]>([]);
  readonly stages = signal<TenantGroupSelectorOption[]>([]);
  readonly grades = signal<TenantGroupSelectorOption[]>([]);
  readonly universities = signal<TenantGroupSelectorOption[]>([]);
  readonly colleges = signal<TenantGroupSelectorOption[]>([]);
  readonly subjects = signal<TenantGroupSelectorOption[]>([]);
  readonly teachers = signal<TenantGroupSelectorOption[]>([]);
  readonly allRooms = signal<TenantGroupSelectorOption[]>([]);
  readonly rooms = signal<TenantGroupSelectorOption[]>([]);

  readonly showOwnedByDropdown = signal(false);
  readonly showTeacherDropdown = signal(false);
  readonly showGradeDropdown = signal(false);
  readonly showSubjectDropdown = signal(false);
  readonly showRoomDropdown = signal(false);
  readonly showStageDropdown = signal(false);
  readonly showUniversityDropdown = signal(false);
  readonly showCollegeDropdown = signal(false);

  readonly teacherSearchQuery = signal('');
  readonly stageSearchQuery = signal('');
  readonly gradeSearchQuery = signal('');
  readonly universitySearchQuery = signal('');
  readonly collegeSearchQuery = signal('');
  readonly subjectSearchQuery = signal('');
  readonly roomSearchQuery = signal('');

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setLoadingOptions(value: boolean): void {
    this.isLoadingOptions.set(value);
  }

  setErrorMessage(value: string | null): void {
    this.errorMessage.set(value);
  }

  setLoadingTeacherAvailability(value: boolean): void {
    this.isLoadingTeacherAvailability.set(value);
  }

  setTeacherAvailabilityLoadFailed(value: boolean): void {
    this.teacherAvailabilityLoadFailed.set(value);
  }

  setTeacherUnavailableRanges(value: TeacherUnavailableRange[]): void {
    this.teacherUnavailableRanges.set(value);
  }

  setTeacherAvailabilityConflict(value: boolean): void {
    this.hasTeacherAvailabilityConflict.set(value);
  }

  setLoadingRoomAvailability(value: boolean): void {
    this.isLoadingRoomAvailability.set(value);
  }

  setRoomAvailabilityLoadFailed(value: boolean): void {
    this.roomAvailabilityLoadFailed.set(value);
  }

  setRoomUnavailableRanges(value: RoomUnavailableRange[]): void {
    this.roomUnavailableRanges.set(value);
    this.bumpRoomAvailabilityRevision();
  }

  setRoomAvailabilityConflict(value: boolean): void {
    this.hasRoomAvailabilityConflict.set(value);
  }

  bumpRoomAvailabilityRevision(): void {
    this.roomAvailabilityRevision.update((value) => value + 1);
  }

  setGroupId(value: string | null): void {
    this.groupId.set(value);
  }

  setSelectedDays(days: string[]): void {
    this.selectedDays.set(days);
  }

  setEducationCategory(category: TenantGroupEducationCategory): void {
    this.educationCategory.set(category);
  }

  setCreateOptions(options: {
    owners: TenantGroupSelectorOption[];
    teachers: TenantGroupSelectorOption[];
    stages: TenantGroupSelectorOption[];
    grades: TenantGroupSelectorOption[];
    universities: TenantGroupSelectorOption[];
    colleges: TenantGroupSelectorOption[];
    rooms: TenantGroupSelectorOption[];
  }): void {
    this.owners.set(options.owners);
    this.allTeachers.set(options.teachers);
    this.allStages.set(options.stages);
    this.allGrades.set(options.grades);
    this.allUniversities.set(options.universities);
    this.allColleges.set(options.colleges);
    this.teachers.set(options.teachers);
    this.stages.set(options.stages);
    this.grades.set(options.grades);
    this.universities.set(options.universities);
    this.colleges.set(options.colleges);
    this.allRooms.set(options.rooms);
    this.rooms.set(options.rooms);
  }

  resetAcademicOptions(): void {
    this.stages.set(this.allStages());
    this.grades.set(this.allGrades());
    this.universities.set(this.allUniversities());
    this.colleges.set(this.allColleges());
    this.subjects.set([]);
  }

  setTeacherAcademicOptions(options: {
    stages: TenantGroupSelectorOption[];
    grades: TenantGroupSelectorOption[];
    universities: TenantGroupSelectorOption[];
    colleges: TenantGroupSelectorOption[];
    subjects: TenantGroupSelectorOption[];
  }): void {
    this.stages.set(options.stages);
    this.grades.set(options.grades);
    this.universities.set(options.universities);
    this.colleges.set(options.colleges);
    this.subjects.set(options.subjects);
  }

  setSubjects(subjects: TenantGroupSelectorOption[]): void {
    this.subjects.set(subjects);
  }

  setTeachers(teachers: TenantGroupSelectorOption[]): void {
    this.teachers.set(teachers);
  }

  setOwnedByDropdownOpen(value: boolean): void {
    this.showOwnedByDropdown.set(value);
  }

  setTeacherDropdownOpen(value: boolean): void {
    this.showTeacherDropdown.set(value);
  }

  setGradeDropdownOpen(value: boolean): void {
    this.showGradeDropdown.set(value);
  }

  setSubjectDropdownOpen(value: boolean): void {
    this.showSubjectDropdown.set(value);
  }

  setRoomDropdownOpen(value: boolean): void {
    this.showRoomDropdown.set(value);
  }

  setStageDropdownOpen(value: boolean): void {
    this.showStageDropdown.set(value);
  }

  setUniversityDropdownOpen(value: boolean): void {
    this.showUniversityDropdown.set(value);
  }

  setCollegeDropdownOpen(value: boolean): void {
    this.showCollegeDropdown.set(value);
  }

  closeAllDropdowns(): void {
    this.showOwnedByDropdown.set(false);
    this.showTeacherDropdown.set(false);
    this.showStageDropdown.set(false);
    this.showGradeDropdown.set(false);
    this.showUniversityDropdown.set(false);
    this.showCollegeDropdown.set(false);
    this.showSubjectDropdown.set(false);
    this.showRoomDropdown.set(false);
  }

  closeAllDropdownsExcept(except: 'ownedBy' | 'teacher' | 'stage' | 'grade' | 'university' | 'college' | 'subject' | 'room'): void {
    if (except !== 'ownedBy') this.showOwnedByDropdown.set(false);
    if (except !== 'teacher') this.showTeacherDropdown.set(false);
    if (except !== 'stage') this.showStageDropdown.set(false);
    if (except !== 'grade') this.showGradeDropdown.set(false);
    if (except !== 'university') this.showUniversityDropdown.set(false);
    if (except !== 'college') this.showCollegeDropdown.set(false);
    if (except !== 'subject') this.showSubjectDropdown.set(false);
    if (except !== 'room') this.showRoomDropdown.set(false);
  }
}
