import { Injectable, computed, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupCreateDataService } from '../data-access/tenant-group-create-data.service';
import {
  ROOM_UNAVAILABLE_MESSAGE,
  RoomUnavailableRange,
  TEACHER_UNAVAILABLE_MESSAGE,
  TenantGroupCreateApiPayload,
  TenantGroupEditApiPayload,
  TenantGroupEducationCategory,
  TenantGroupSelectorOption,
  TenantGroupTaskData,
  TenantGroupPayload,
  TeacherUnavailableRange,
} from '../models/tenant-group-create.models';
import { TenantGroupCreateStore } from './tenant-group-create.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(TenantGroupCreateStore);
  private readonly data = inject(TenantGroupCreateDataService);

  private isSuccess = false;
  private taskId = 'create-group-task';
  private scheduleValidationSubscription: Subscription | null = null;

  readonly days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  readonly isSubmitting = this.store.isSubmitting;
  readonly isLoadingOptions = this.store.isLoadingOptions;
  readonly errorMessage = this.store.errorMessage;
  readonly teacherUnavailableRanges = this.store.teacherUnavailableRanges;
  readonly isLoadingTeacherAvailability = this.store.isLoadingTeacherAvailability;
  readonly hasTeacherAvailabilityConflict = this.store.hasTeacherAvailabilityConflict;
  readonly roomUnavailableRanges = this.store.roomUnavailableRanges;
  readonly isLoadingRoomAvailability = this.store.isLoadingRoomAvailability;
  readonly hasRoomAvailabilityConflict = this.store.hasRoomAvailabilityConflict;
  readonly groupId = this.store.groupId;
  readonly isEditMode = this.store.isEditMode;
  readonly selectedDays = this.store.selectedDays;
  readonly educationCategory = this.store.educationCategory;

  readonly showOwnedByDropdown = this.store.showOwnedByDropdown;
  readonly showTeacherDropdown = this.store.showTeacherDropdown;
  readonly showStageDropdown = this.store.showStageDropdown;
  readonly showGradeDropdown = this.store.showGradeDropdown;
  readonly showUniversityDropdown = this.store.showUniversityDropdown;
  readonly showCollegeDropdown = this.store.showCollegeDropdown;
  readonly showSubjectDropdown = this.store.showSubjectDropdown;
  readonly showRoomDropdown = this.store.showRoomDropdown;

  readonly teacherSearchQuery = this.store.teacherSearchQuery;
  readonly stageSearchQuery = this.store.stageSearchQuery;
  readonly gradeSearchQuery = this.store.gradeSearchQuery;
  readonly universitySearchQuery = this.store.universitySearchQuery;
  readonly collegeSearchQuery = this.store.collegeSearchQuery;
  readonly subjectSearchQuery = this.store.subjectSearchQuery;
  readonly roomSearchQuery = this.store.roomSearchQuery;

  readonly owners = this.store.owners;
  readonly ownerChoices = computed<TenantGroupSelectorOption[]>(() => [
    { id: 'CENTER', name: 'Center' },
    { id: 'TEACHER', name: 'Teacher' },
  ]);
  readonly stages = this.store.stages;
  readonly grades = this.store.grades;
  readonly universities = this.store.universities;
  readonly colleges = this.store.colleges;
  readonly subjects = this.store.subjects;
  readonly teachers = this.store.teachers;
  readonly rooms = this.store.rooms;

  readonly groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    educationCategory: ['BASIC_EDUCATION' as TenantGroupEducationCategory, Validators.required],
    stage: ['', Validators.required],
    grade: ['', Validators.required],
    university: [''],
    college: [''],
    subject: ['', Validators.required],
    teacher: ['', Validators.required],
    ownedBy: ['', Validators.required],
    room: ['', Validators.required],
    capacity: [25, [Validators.required, Validators.min(1)]],
    isFixedTime: [true],
    startTime: ['10:00', Validators.required],
    duration: [90, Validators.required],
    daySchedules: this.fb.group({}),
    fees: [500, Validators.required],
    autoInvoice: [true],
    allowSelfEnroll: [false],
    hasSpecificDuration: [false],
    startDate: [''],
    endDate: [''],
    requireApproval: [true],
    isActive: [true],
  });

  readonly filteredTeachers = computed(() => {
    const query = this.teacherSearchQuery().toLowerCase();
    const teachers = this.teachers();
    if (!query) return teachers;
    return teachers.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  readonly filteredGrades = computed(() => {
    const query = this.gradeSearchQuery().toLowerCase();
    const stage = this.selectedOption(this.stages(), this.groupForm.get('stage')?.value ?? '');
    const grades = this.grades().filter((grade) => !stage || grade.parentId === stage.id);
    if (!query) return grades;
    return grades.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  readonly filteredStages = computed(() => {
    const query = this.stageSearchQuery().toLowerCase();
    const stages = this.stages();
    if (!query) return stages;
    return stages.filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly filteredUniversities = computed(() => {
    const query = this.universitySearchQuery().toLowerCase();
    const universities = this.universities();
    if (!query) return universities;
    return universities.filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly filteredColleges = computed(() => {
    const query = this.collegeSearchQuery().toLowerCase();
    const university = this.selectedOption(this.universities(), this.groupForm.get('university')?.value ?? '');
    const colleges = this.colleges().filter((college) => !university || college.parentId === university.id);
    if (!query) return colleges;
    return colleges.filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly filteredSubjects = computed(() => {
    const query = this.subjectSearchQuery().toLowerCase();
    const category = this.educationCategory();
    const stage = this.selectedOption(this.stages(), this.groupForm.get('stage')?.value ?? '');
    const grade = this.selectedOption(this.grades(), this.groupForm.get('grade')?.value ?? '');
    const university = this.selectedOption(this.universities(), this.groupForm.get('university')?.value ?? '');
    const college = this.selectedOption(this.colleges(), this.groupForm.get('college')?.value ?? '');
    const subjects = this.subjects().filter((subject) => {
      if (category === 'BASIC_EDUCATION') {
        return (!stage || subject.stageId === stage.id) && (!grade || subject.gradeId === grade.id || subject.parentId === grade.id);
      }
      return (!university || subject.universityId === university.id) && (!college || subject.collegeId === college.id || subject.parentId === college.id);
    });
    if (!query) return subjects;
    return subjects.filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly filteredRooms = computed(() => {
    this.store.roomAvailabilityRevision();
    const query = this.roomSearchQuery().toLowerCase();
    const rooms = this.store.allRooms().filter((room) => this.isRoomAvailableForCurrentSchedule(room.id));
    if (!query) return rooms;
    return rooms.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  initialize(groupId: string | null): void {
    this.ensureScheduleValidationSubscription();
    const selectedGroupId = groupId?.trim() || null;
    this.loadCreateOptions(selectedGroupId);
    if (selectedGroupId) {
      this.store.setGroupId(selectedGroupId);
      this.taskId = `edit-group-${selectedGroupId}`;
      return;
    }

      this.store.setGroupId(null);
      this.taskId = 'create-group-task';
    this.restoreSavedTask();
    this.loadTeacherAvailabilityForSelection();
  }

  private restoreSavedTask(): void {
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask?.data) {
      const data = savedTask.data as TenantGroupTaskData;
      this.groupForm.patchValue(data);
      if (data.scheduleDays) {
        this.store.setSelectedDays(data.scheduleDays);
      }

      if (data.isFixedTime === false) {
        this.onTimeTypeChange(false);
        if (data.daySchedules) {
          const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
          daySchedules.patchValue(data.daySchedules);
        }
      }

      this.taskService.removeTask(this.taskId);
    }
  }

  onEducationCategoryChange(category: TenantGroupEducationCategory): void {
    this.store.setEducationCategory(category);
    const currentTeacher = this.groupForm.get('teacher')?.value ?? '';
    this.groupForm.patchValue({
      educationCategory: category,
      stage: '',
      grade: '',
      university: '',
      college: '',
      subject: '',
    });
    if (category === 'BASIC_EDUCATION') {
      this.groupForm.get('stage')?.setValidators(Validators.required);
      this.groupForm.get('grade')?.setValidators(Validators.required);
      this.groupForm.get('university')?.clearValidators();
      this.groupForm.get('college')?.clearValidators();
    } else {
      this.groupForm.get('stage')?.clearValidators();
      this.groupForm.get('grade')?.clearValidators();
      this.groupForm.get('university')?.setValidators(Validators.required);
      this.groupForm.get('college')?.setValidators(Validators.required);
    }
    ['stage', 'grade', 'university', 'college'].forEach((control) => this.groupForm.get(control)?.updateValueAndValidity());
    this.store.resetAcademicOptions();
    this.store.setTeachers(this.store.allTeachers());
    if (currentTeacher) {
      this.loadTeacherClassification();
    }
  }

  private hasSelectedTeacher(): boolean {
    const selected = this.groupForm.get('teacher')?.value ?? '';
    return this.selectedOption(this.store.allTeachers(), selected) !== null;
  }

  private isBasicClassificationComplete(): boolean {
    return !!this.selectedOption(this.stages(), this.groupForm.get('stage')?.value ?? '')
      && !!this.selectedOption(this.grades(), this.groupForm.get('grade')?.value ?? '')
      && !!this.selectedOption(this.subjects(), this.groupForm.get('subject')?.value ?? '');
  }

  private isUniversityClassificationComplete(): boolean {
    return !!this.selectedOption(this.universities(), this.groupForm.get('university')?.value ?? '')
      && !!this.selectedOption(this.colleges(), this.groupForm.get('college')?.value ?? '')
      && !!this.selectedOption(this.subjects(), this.groupForm.get('subject')?.value ?? '');
  }

  private isClassificationComplete(): boolean {
    if (this.educationCategory() === 'BASIC_EDUCATION') {
      return this.isBasicClassificationComplete();
    }
    return this.isUniversityClassificationComplete();
  }

  private resetTeachersForIncompleteClassification(): void {
    if (!this.hasSelectedTeacher()) {
      this.store.setTeachers(this.store.allTeachers());
    }
  }

  private clearTeacherIfNotEligible(teachers: TenantGroupSelectorOption[]): void {
    const selected = this.groupForm.get('teacher')?.value ?? '';
    if (selected && !teachers.some((teacher) => teacher.name === selected)) {
      this.groupForm.patchValue({ teacher: '' });
      this.loadTeacherAvailabilityForSelection();
    }
  }

  private loadAssignedTeachersIfClassificationComplete(): void {
    if (this.isClassificationComplete()) {
      this.loadAssignedTeachers();
    } else {
      this.resetTeachersForIncompleteClassification();
    }
  }

  onDestroy(): void {
    this.scheduleValidationSubscription?.unsubscribe();
    this.scheduleValidationSubscription = null;
    const value = this.groupForm.getRawValue();
    const hasData = value.name !== '' || value.ownedBy !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Creating'} Group: ${value.name || 'New Group'}`,
        route: this.router.url,
        data: {
          ...value,
          scheduleDays: this.selectedDays(),
        },
      });
    }
  }

  onDayToggle(day: string): void {
    const current = this.selectedDays();
    let next: string[];

    if (current.includes(day)) {
      next = current.filter((item) => item !== day);
      const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
      if (daySchedules.contains(day)) {
        daySchedules.removeControl(day);
      }
    } else {
      next = [...current, day];
      if (!this.groupForm.get('isFixedTime')?.value) {
        const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
        if (!daySchedules.contains(day)) {
          daySchedules.addControl(
            day,
            this.fb.group({
              startTime: ['', Validators.required],
              endTime: ['', Validators.required],
            }),
          );
        }
      }
    }

    this.store.setSelectedDays(next);
    this.validateCurrentAvailability();
  }

  onTimeTypeChange(isFixed: boolean): void {
    const daySchedules = this.groupForm.get('daySchedules') as FormGroup;

    if (!isFixed) {
      this.selectedDays().forEach((day) => {
        if (!daySchedules.contains(day)) {
          daySchedules.addControl(
            day,
            this.fb.group({
              startTime: ['', Validators.required],
              endTime: ['', Validators.required],
            }),
          );
        }
      });
      this.groupForm.get('startTime')?.clearValidators();
      this.groupForm.get('duration')?.clearValidators();
    } else {
      Object.keys(daySchedules.controls).forEach((day) => daySchedules.removeControl(day));
      this.groupForm.get('startTime')?.setValidators(Validators.required);
      this.groupForm.get('duration')?.setValidators(Validators.required);
    }

    this.groupForm.get('startTime')?.updateValueAndValidity();
    this.groupForm.get('duration')?.updateValueAndValidity();
    this.validateCurrentAvailability();
  }

  toggleOwnedByDropdown(): void {
    const next = !this.showOwnedByDropdown();
    this.store.setOwnedByDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('ownedBy');
    }
  }

  selectOwnedBy(value: string): void {
    this.groupForm.patchValue({
      ownedBy: value,
    });
    this.store.setOwnedByDropdownOpen(false);
  }

  toggleTeacherDropdown(): void {
    const next = !this.showTeacherDropdown();
    this.store.setTeacherDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('teacher');
      this.teacherSearchQuery.set('');
    }
  }

  selectTeacher(value: string): void {
    this.groupForm.patchValue({ teacher: value });
    this.store.setTeacherDropdownOpen(false);
    this.loadTeacherClassification();
    this.loadTeacherAvailabilityForSelection();
    this.validateCurrentRoomAvailability();
  }

  toggleStageDropdown(): void {
    const next = !this.showStageDropdown();
    this.store.setStageDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('stage');
      this.stageSearchQuery.set('');
    }
  }

  selectStage(value: string): void {
    this.groupForm.patchValue({ stage: value, grade: '', subject: '' });
    this.store.setStageDropdownOpen(false);
    this.store.setSubjects([]);
    this.loadAssignedTeachersIfClassificationComplete();
  }

  toggleGradeDropdown(): void {
    const next = !this.showGradeDropdown();
    this.store.setGradeDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('grade');
      this.gradeSearchQuery.set('');
    }
  }

  selectGrade(value: string): void {
    this.groupForm.patchValue({ grade: value, subject: '' });
    this.store.setGradeDropdownOpen(false);
    this.store.setSubjects([]);
    if (!this.hasSelectedTeacher()) {
      this.loadSubjects();
    }
    this.loadAssignedTeachersIfClassificationComplete();
  }

  toggleUniversityDropdown(): void {
    const next = !this.showUniversityDropdown();
    this.store.setUniversityDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('university');
      this.universitySearchQuery.set('');
    }
  }

  selectUniversity(value: string): void {
    this.groupForm.patchValue({ university: value, college: '', subject: '' });
    this.store.setUniversityDropdownOpen(false);
    this.store.setSubjects([]);
    this.loadAssignedTeachersIfClassificationComplete();
  }

  toggleCollegeDropdown(): void {
    const next = !this.showCollegeDropdown();
    this.store.setCollegeDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('college');
      this.collegeSearchQuery.set('');
    }
  }

  selectCollege(value: string): void {
    this.groupForm.patchValue({ college: value, subject: '' });
    this.store.setCollegeDropdownOpen(false);
    this.store.setSubjects([]);
    if (!this.hasSelectedTeacher()) {
      this.loadSubjects();
    }
    this.loadAssignedTeachersIfClassificationComplete();
  }

  toggleSubjectDropdown(): void {
    const next = !this.showSubjectDropdown();
    this.store.setSubjectDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('subject');
      this.subjectSearchQuery.set('');
    }
  }

  selectSubject(value: string): void {
    this.groupForm.patchValue({ subject: value });
    this.store.setSubjectDropdownOpen(false);
    this.loadAssignedTeachersIfClassificationComplete();
  }

  toggleRoomDropdown(): void {
    const next = !this.showRoomDropdown();
    this.store.setRoomDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('room');
      this.roomSearchQuery.set('');
    }
  }

  selectRoom(value: string): void {
    this.groupForm.patchValue({ room: value });
    this.store.setRoomDropdownOpen(false);
    this.validateCurrentRoomAvailability();
  }

  setTeacherSearchQuery(value: string): void {
    this.teacherSearchQuery.set(value);
  }

  setGradeSearchQuery(value: string): void {
    this.gradeSearchQuery.set(value);
  }

  setStageSearchQuery(value: string): void {
    this.stageSearchQuery.set(value);
  }

  setUniversitySearchQuery(value: string): void {
    this.universitySearchQuery.set(value);
  }

  setCollegeSearchQuery(value: string): void {
    this.collegeSearchQuery.set(value);
  }

  setSubjectSearchQuery(value: string): void {
    this.subjectSearchQuery.set(value);
  }

  setRoomSearchQuery(value: string): void {
    this.roomSearchQuery.set(value);
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/groups']);
  }

  onSubmit(): void {
    this.validateCurrentAvailability(true);
    if (this.isLoadingTeacherAvailability() || this.store.teacherAvailabilityLoadFailed()) {
      this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), teacherUnavailable: true });
    }
    if (this.isLoadingRoomAvailability() || this.store.roomAvailabilityLoadFailed()) {
      this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), roomUnavailable: true });
    }
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload: TenantGroupPayload = {
      ...(this.groupForm.getRawValue() as Omit<TenantGroupPayload, 'scheduleDays'>),
      scheduleDays: this.selectedDays(),
    };

    this.data
      .createOrUpdateGroup(this.toApiPayload(payload), this.groupId())
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.taskService.removeTask(this.taskId);
          this.router.navigate(['/tenant/groups']);
        },
        error: (error: Error) => {
          this.store.setErrorMessage(error.message);
        },
      });
  }

  private loadCreateOptions(groupId?: string | null): void {
    this.store.setLoadingOptions(true);
    this.data
      .loadCreateOptions()
      .pipe(finalize(() => this.store.setLoadingOptions(false)))
      .subscribe({
        next: (options) => {
          this.store.setCreateOptions(options);
          this.loadRoomAvailabilityForSelection(groupId);
          if (groupId) {
            this.loadGroupForEdit(groupId);
          }
        },
        error: (error: Error) => {
          this.store.setErrorMessage(error.message);
        },
      });
  }

  private loadGroupForEdit(groupId: string): void {
    this.data.loadGroupForEdit(groupId).subscribe({
      next: (group) => this.patchGroupForEdit(group),
      error: (error: Error) => this.store.setErrorMessage(error.message),
    });
  }

  private patchGroupForEdit(group: TenantGroupEditApiPayload): void {
    this.applyEducationCategory(group.educationCategory);
    this.store.resetAcademicOptions();
    this.patchCommonEditFields(group);

    if (group.educationCategory === 'BASIC_EDUCATION') {
      this.patchBasicEditFields(group);
      return;
    }

    this.patchUniversityEditFields(group);
  }

  private patchCommonEditFields(group: TenantGroupEditApiPayload): void {
    this.groupForm.patchValue({
      name: group.name,
      educationCategory: group.educationCategory,
      ownedBy: this.ownerChoiceForEdit(group),
      room: this.optionNameById(this.rooms(), group.roomId),
      capacity: group.capacity,
      isFixedTime: group.isFixedTime,
      startTime: group.startTime,
      duration: group.duration,
      fees: group.pricePerStudent,
      autoInvoice: group.autoInvoice,
      allowSelfEnroll: group.allowSelfEnroll,
      hasSpecificDuration: group.hasSpecificDuration,
      startDate: group.startDate ?? '',
      endDate: group.endDate ?? '',
      requireApproval: group.requireApproval,
      isActive: group.isActive,
    });
    this.store.setSelectedDays(group.scheduleDays ?? []);
    this.onTimeTypeChange(group.isFixedTime);
    if (!group.isFixedTime && group.daySchedules) {
      const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
      daySchedules.patchValue(group.daySchedules);
    }
  }

  private patchBasicEditFields(group: TenantGroupEditApiPayload): void {
    this.groupForm.patchValue({
      stage: this.optionNameById(this.stages(), group.stageId),
      grade: this.optionNameById(this.grades(), group.gradeId),
      university: '',
      college: '',
      subject: '',
      teacher: '',
    });
    if (!group.stageId || !group.gradeId) {
      return;
    }
    this.data
      .loadSubjects({
        educationCategory: 'BASIC_EDUCATION',
        stageId: group.stageId,
        gradeId: group.gradeId,
      })
      .subscribe({
        next: (subjects) => {
          this.store.setSubjects(subjects);
          this.groupForm.patchValue({ subject: this.optionNameById(subjects, group.subjectId) });
          this.loadAssignedTeachersForEdit(group);
        },
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private patchUniversityEditFields(group: TenantGroupEditApiPayload): void {
    this.groupForm.patchValue({
      stage: '',
      grade: '',
      university: this.optionNameById(this.universities(), group.universityId),
      college: this.optionNameById(this.colleges(), group.collegeId),
      subject: '',
      teacher: '',
    });
    if (!group.universityId || !group.collegeId) {
      return;
    }
    this.data
      .loadSubjects({
        educationCategory: 'UNIVERSITY_EDUCATION',
        universityId: group.universityId,
        collegeId: group.collegeId,
      })
      .subscribe({
        next: (subjects) => {
          this.store.setSubjects(subjects);
          this.groupForm.patchValue({ subject: this.optionNameById(subjects, group.universitySubjectId) });
          this.loadAssignedTeachersForEdit(group);
        },
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private loadAssignedTeachersForEdit(group: TenantGroupEditApiPayload): void {
    const subjectId = group.educationCategory === 'BASIC_EDUCATION' ? group.subjectId : undefined;
    const universitySubjectId = group.educationCategory === 'UNIVERSITY_EDUCATION' ? group.universitySubjectId : undefined;
    if (!subjectId && !universitySubjectId) {
      return;
    }
    this.data
      .loadAssignedTeachers({
        educationCategory: group.educationCategory,
        stageId: group.stageId ?? undefined,
        gradeId: group.gradeId ?? undefined,
        subjectId: subjectId ?? undefined,
        universityId: group.universityId ?? undefined,
        collegeId: group.collegeId ?? undefined,
        universitySubjectId: universitySubjectId ?? undefined,
      })
      .subscribe({
        next: (teachers) => {
          this.store.setTeachers(teachers);
          this.groupForm.patchValue({ teacher: this.optionNameById(teachers, group.assignedTeacherId) });
          this.loadTeacherAvailabilityForSelection();
        },
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private loadSubjects(): void {
    const category = this.educationCategory();
    const stage = this.selectedOption(this.stages(), this.groupForm.get('stage')?.value ?? '');
    const grade = this.selectedOption(this.grades(), this.groupForm.get('grade')?.value ?? '');
    const university = this.selectedOption(this.universities(), this.groupForm.get('university')?.value ?? '');
    const college = this.selectedOption(this.colleges(), this.groupForm.get('college')?.value ?? '');
    if (category === 'BASIC_EDUCATION' && (!stage || !grade)) return;
    if (category === 'UNIVERSITY_EDUCATION' && (!university || !college)) return;
    this.data
      .loadSubjects({
        educationCategory: category,
        stageId: stage?.id,
        gradeId: grade?.id,
        universityId: university?.id,
        collegeId: college?.id,
      })
      .subscribe({
        next: (subjects) => this.store.setSubjects(subjects),
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private loadAssignedTeachers(): void {
    const category = this.educationCategory();
    const stage = this.selectedOption(this.stages(), this.groupForm.get('stage')?.value ?? '');
    const grade = this.selectedOption(this.grades(), this.groupForm.get('grade')?.value ?? '');
    const subject = this.selectedOption(this.subjects(), this.groupForm.get('subject')?.value ?? '');
    const university = this.selectedOption(this.universities(), this.groupForm.get('university')?.value ?? '');
    const college = this.selectedOption(this.colleges(), this.groupForm.get('college')?.value ?? '');
    if (!subject) return;
    this.data
      .loadAssignedTeachers({
        educationCategory: category,
        stageId: stage?.id,
        gradeId: grade?.id,
        subjectId: category === 'BASIC_EDUCATION' ? subject.id : undefined,
        universityId: university?.id,
        collegeId: college?.id,
        universitySubjectId: category === 'UNIVERSITY_EDUCATION' ? subject.id : undefined,
      })
      .subscribe({
        next: (teachers) => {
          this.store.setTeachers(teachers);
          this.clearTeacherIfNotEligible(teachers);
        },
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private loadTeacherClassification(): void {
    const teacher = this.selectedOption(this.store.allTeachers(), this.groupForm.get('teacher')?.value ?? '');
    if (!teacher) return;
    this.data
      .loadTeacherClassification({
        educationCategory: this.educationCategory(),
        teacherId: teacher.id,
      })
      .subscribe({
        next: (options) => {
          this.store.setTeacherAcademicOptions(options);
          this.clearInvalidAcademicSelections();
        },
        error: (error: Error) => this.store.setErrorMessage(error.message),
      });
  }

  private loadTeacherAvailabilityForSelection(): void {
    const teacherName = this.groupForm.get('teacher')?.value ?? '';
    const teacher = this.selectedOption(this.store.allTeachers(), teacherName) ?? this.selectedOption(this.teachers(), teacherName);
    if (!teacher) {
      this.store.setTeacherUnavailableRanges([]);
      this.store.setTeacherAvailabilityLoadFailed(false);
      this.store.setTeacherAvailabilityConflict(false);
      this.groupForm.setErrors(this.withoutFormError('teacherUnavailable'));
      return;
    }
    this.store.setLoadingTeacherAvailability(true);
    this.store.setTeacherAvailabilityLoadFailed(false);
    this.data
      .loadTeacherAvailability(teacher.id, this.groupId())
      .pipe(finalize(() => this.store.setLoadingTeacherAvailability(false)))
      .subscribe({
        next: (availability) => {
          this.store.setTeacherUnavailableRanges(availability.unavailableRanges ?? []);
          this.validateCurrentTeacherAvailability();
        },
        error: (error: Error) => {
          this.store.setTeacherUnavailableRanges([]);
          this.store.setTeacherAvailabilityLoadFailed(true);
          this.store.setErrorMessage(error.message);
          this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), teacherUnavailable: true });
        },
      });
  }

  private loadRoomAvailabilityForSelection(groupId?: string | null): void {
    this.store.setLoadingRoomAvailability(true);
    this.store.setRoomAvailabilityLoadFailed(false);
    this.data
      .loadRoomAvailability(groupId ?? this.groupId())
      .pipe(finalize(() => this.store.setLoadingRoomAvailability(false)))
      .subscribe({
        next: (availability) => {
          this.store.setRoomUnavailableRanges(availability.unavailableRanges ?? []);
          this.validateCurrentRoomAvailability();
        },
        error: (error: Error) => {
          this.store.setRoomUnavailableRanges([]);
          this.store.setRoomAvailabilityLoadFailed(true);
          this.store.setErrorMessage(error.message);
          this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), roomUnavailable: true });
        },
      });
  }

  private ensureScheduleValidationSubscription(): void {
    if (this.scheduleValidationSubscription) {
      return;
    }
    this.scheduleValidationSubscription = this.groupForm.valueChanges.subscribe(() => {
      this.validateCurrentAvailability();
    });
  }

  private validateCurrentAvailability(showMessage = false): void {
    this.validateCurrentTeacherAvailability(showMessage);
    this.validateCurrentRoomAvailability(showMessage);
  }

  private validateCurrentTeacherAvailability(showMessage = false): void {
    const conflict = this.currentScheduleConflicts();
    this.store.setTeacherAvailabilityConflict(conflict);
    if (conflict) {
      this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), teacherUnavailable: true });
      if (showMessage || this.errorMessage() === TEACHER_UNAVAILABLE_MESSAGE) {
        this.store.setErrorMessage(TEACHER_UNAVAILABLE_MESSAGE);
      }
      return;
    }
    this.groupForm.setErrors(this.withoutFormError('teacherUnavailable'));
    if (this.errorMessage() === TEACHER_UNAVAILABLE_MESSAGE) {
      this.store.setErrorMessage(null);
    }
  }

  private validateCurrentRoomAvailability(showMessage = false): void {
    const conflict = this.currentRoomScheduleConflicts();
    this.store.setRoomAvailabilityConflict(conflict);
    this.store.bumpRoomAvailabilityRevision();
    if (conflict) {
      this.groupForm.setErrors({ ...(this.groupForm.errors ?? {}), roomUnavailable: true });
      if (showMessage || this.errorMessage() === ROOM_UNAVAILABLE_MESSAGE) {
        this.store.setErrorMessage(ROOM_UNAVAILABLE_MESSAGE);
      }
      return;
    }
    this.groupForm.setErrors(this.withoutFormError('roomUnavailable'));
    if (this.errorMessage() === ROOM_UNAVAILABLE_MESSAGE) {
      this.store.setErrorMessage(null);
    }
  }

  private currentScheduleConflicts(): boolean {
    const ranges = this.teacherUnavailableRanges();
    if (ranges.length === 0) {
      return false;
    }
    if (this.groupForm.get('isFixedTime')?.value === false) {
      const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
      return this.selectedDays().some((day) => {
        const group = daySchedules.get(day) as FormGroup | null;
        const start = this.timeToMinute(group?.get('startTime')?.value ?? '');
        const end = this.timeToMinute(group?.get('endTime')?.value ?? '');
        return start !== null && end !== null && this.conflictsWithRanges(day, start, end, ranges);
      });
    }
    const start = this.timeToMinute(this.groupForm.get('startTime')?.value ?? '');
    const duration = Number(this.groupForm.get('duration')?.value ?? 0);
    if (start === null || !Number.isFinite(duration) || duration <= 0) {
      return false;
    }
    return this.selectedDays().some((day) => this.conflictsWithRanges(day, start, start + duration, ranges));
  }

  private currentRoomScheduleConflicts(): boolean {
    const roomName = this.groupForm.get('room')?.value ?? '';
    const selectedRoom = this.selectedOption(this.store.allRooms(), roomName);
    if (!selectedRoom) {
      return false;
    }
    return !this.isRoomAvailableForCurrentSchedule(selectedRoom.id);
  }

  private isRoomAvailableForCurrentSchedule(roomId: string): boolean {
    const ranges = this.roomUnavailableRanges().filter((range) => range.roomId === roomId);
    if (ranges.length === 0) {
      return true;
    }
    if (this.groupForm.get('isFixedTime')?.value === false) {
      const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
      return !this.selectedDays().some((day) => {
        const group = daySchedules.get(day) as FormGroup | null;
        const start = this.timeToMinute(group?.get('startTime')?.value ?? '');
        const end = this.timeToMinute(group?.get('endTime')?.value ?? '');
        return start !== null && end !== null && this.conflictsWithRoomRanges(day, start, end, ranges);
      });
    }
    const start = this.timeToMinute(this.groupForm.get('startTime')?.value ?? '');
    const duration = Number(this.groupForm.get('duration')?.value ?? 0);
    if (start === null || !Number.isFinite(duration) || duration <= 0) {
      return true;
    }
    return !this.selectedDays().some((day) => this.conflictsWithRoomRanges(day, start, start + duration, ranges));
  }

  private conflictsWithRanges(day: string, start: number, end: number, ranges: TeacherUnavailableRange[]): boolean {
    if (end <= start) {
      return false;
    }
    const normalizedDay = day.trim().toLowerCase();
    return ranges.some((range) => {
      if ((range.day ?? '').trim().toLowerCase() !== normalizedDay) {
        return false;
      }
      const rangeStart = this.timeToMinute(range.startTime);
      if (rangeStart === null || !range.duration) {
        return false;
      }
      const rangeEnd = rangeStart + range.duration;
      return start < rangeEnd && end > rangeStart;
    });
  }

  private conflictsWithRoomRanges(day: string, start: number, end: number, ranges: RoomUnavailableRange[]): boolean {
    if (end <= start) {
      return false;
    }
    const normalizedDay = day.trim().toLowerCase();
    return ranges.some((range) => {
      if ((range.day ?? '').trim().toLowerCase() !== normalizedDay) {
        return false;
      }
      const rangeStart = this.timeToMinute(range.startTime);
      if (rangeStart === null || !range.duration) {
        return false;
      }
      const rangeEnd = rangeStart + range.duration;
      return start < rangeEnd && end > rangeStart;
    });
  }

  private timeToMinute(value: string): number | null {
    const normalized = this.normalizeTime(value);
    if (!normalized) {
      return null;
    }
    const match = /^(\d{1,2}):(\d{2})$/.exec(normalized);
    if (!match) {
      return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return hour * 60 + minute;
  }

  private normalizeTime(value: string): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    const clockMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    if (clockMatch) {
      const hour = Number(clockMatch[1]);
      const minute = Number(clockMatch[2]);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
      }
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    const displayMatch = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(trimmed);
    if (!displayMatch) {
      return null;
    }
    const displayHour = Number(displayMatch[1]);
    const minute = Number(displayMatch[2]);
    if (displayHour < 1 || displayHour > 12 || minute < 0 || minute > 59) {
      return null;
    }
    const period = displayMatch[3].toUpperCase();
    const hour = period === 'PM' ? (displayHour % 12) + 12 : displayHour % 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private withoutFormError(errorKey: string): Record<string, unknown> | null {
    const errors = { ...(this.groupForm.errors ?? {}) };
    delete errors[errorKey];
    return Object.keys(errors).length > 0 ? errors : null;
  }

  private clearInvalidAcademicSelections(): void {
    const category = this.educationCategory();
    if (category === 'BASIC_EDUCATION') {
      const stage = this.groupForm.get('stage')?.value ?? '';
      const grade = this.groupForm.get('grade')?.value ?? '';
      const subject = this.groupForm.get('subject')?.value ?? '';
      const nextStage = this.selectedOption(this.stages(), stage);
      const nextGrade = nextStage ? this.selectedOption(this.grades(), grade) : null;
      const nextSubject = nextStage && nextGrade ? this.selectedOption(this.subjects(), subject) : null;
      const validStage = !!nextStage;
      const validGrade = !!nextStage && !!nextGrade && nextGrade.parentId === nextStage.id;
      const validSubject = !!nextStage
        && !!nextGrade
        && !!nextSubject
        && nextSubject.stageId === nextStage.id
        && nextSubject.gradeId === nextGrade.id;
      this.groupForm.patchValue({
        stage: validStage ? stage : '',
        grade: validGrade ? grade : '',
        subject: validSubject ? subject : '',
      });
      return;
    }

    const university = this.groupForm.get('university')?.value ?? '';
    const college = this.groupForm.get('college')?.value ?? '';
    const subject = this.groupForm.get('subject')?.value ?? '';
    const nextUniversity = this.selectedOption(this.universities(), university);
    const nextCollege = nextUniversity ? this.selectedOption(this.colleges(), college) : null;
    const nextSubject = nextUniversity && nextCollege ? this.selectedOption(this.subjects(), subject) : null;
    const validUniversity = !!nextUniversity;
    const validCollege = !!nextUniversity && !!nextCollege && nextCollege.parentId === nextUniversity.id;
    const validSubject = !!nextUniversity
      && !!nextCollege
      && !!nextSubject
      && nextSubject.universityId === nextUniversity.id
      && nextSubject.collegeId === nextCollege.id;
    this.groupForm.patchValue({
      university: validUniversity ? university : '',
      college: validCollege ? college : '',
      subject: validSubject ? subject : '',
    });
  }

  private applyEducationCategory(category: TenantGroupEducationCategory): void {
    this.store.setEducationCategory(category);
    this.groupForm.patchValue({ educationCategory: category });
    if (category === 'BASIC_EDUCATION') {
      this.groupForm.get('stage')?.setValidators(Validators.required);
      this.groupForm.get('grade')?.setValidators(Validators.required);
      this.groupForm.get('university')?.clearValidators();
      this.groupForm.get('college')?.clearValidators();
    } else {
      this.groupForm.get('stage')?.clearValidators();
      this.groupForm.get('grade')?.clearValidators();
      this.groupForm.get('university')?.setValidators(Validators.required);
      this.groupForm.get('college')?.setValidators(Validators.required);
    }
    ['stage', 'grade', 'university', 'college'].forEach((control) => this.groupForm.get(control)?.updateValueAndValidity());
  }

  private toApiPayload(payload: TenantGroupPayload): TenantGroupCreateApiPayload {
    const category = payload.educationCategory;
    const stage = this.selectedOption(this.stages(), payload.stage);
    const grade = this.selectedOption(this.grades(), payload.grade);
    const university = this.selectedOption(this.universities(), payload.university);
    const college = this.selectedOption(this.colleges(), payload.college);
    const subject = this.selectedOption(this.subjects(), payload.subject);
    const teacher = this.selectedOption(this.teachers(), payload.teacher);
    const ownerId = this.resolveOwnerId(payload.ownedBy, teacher);
    const room = this.selectedOption(this.store.allRooms(), payload.room);

    return {
      name: payload.name,
      pricePerStudent: payload.fees,
      ownedByAppUserId: ownerId,
      educationCategory: category,
      stageId: category === 'BASIC_EDUCATION' ? stage?.id ?? null : null,
      gradeId: category === 'BASIC_EDUCATION' ? grade?.id ?? null : null,
      subjectId: category === 'BASIC_EDUCATION' ? subject?.id ?? null : null,
      universityId: category === 'UNIVERSITY_EDUCATION' ? university?.id ?? null : null,
      collegeId: category === 'UNIVERSITY_EDUCATION' ? college?.id ?? null : null,
      universitySubjectId: category === 'UNIVERSITY_EDUCATION' ? subject?.id ?? null : null,
      assignedTeacherId: teacher?.id ?? '',
      roomId: room?.id ?? null,
      capacity: payload.capacity,
      isFixedTime: payload.isFixedTime,
      startTime: this.normalizeTime(payload.startTime) ?? payload.startTime,
      duration: payload.duration,
      daySchedules: this.normalizeDaySchedules(payload.daySchedules),
      scheduleDays: payload.scheduleDays,
      autoInvoice: payload.autoInvoice,
      allowSelfEnroll: payload.allowSelfEnroll,
      hasSpecificDuration: payload.hasSpecificDuration,
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      requireApproval: payload.requireApproval,
      isActive: payload.isActive,
    };
  }

  private normalizeDaySchedules(
    schedules: Record<string, { startTime: string; endTime: string }>,
  ): Record<string, { startTime: string; endTime: string }> {
    return Object.fromEntries(
      Object.entries(schedules ?? {}).map(([day, schedule]) => [
        day,
        {
          startTime: this.normalizeTime(schedule.startTime) ?? schedule.startTime,
          endTime: this.normalizeTime(schedule.endTime) ?? schedule.endTime,
        },
      ]),
    );
  }

  private selectedOption(options: TenantGroupSelectorOption[], name: string): TenantGroupSelectorOption | null {
    return options.find((option) => option.name === name) ?? null;
  }

  private optionNameById(options: TenantGroupSelectorOption[], id: string | null): string {
    if (!id) {
      return '';
    }
    return options.find((option) => option.id === id)?.name ?? '';
  }

  private ownerChoiceForEdit(group: TenantGroupEditApiPayload): string {
    if (group.ownedByAppUserId === group.assignedTeacherId) {
      return 'Teacher';
    }
    return 'Center';
  }

  private resolveOwnerId(ownedBy: string, teacher: TenantGroupSelectorOption | null): string {
    if (ownedBy === 'Teacher') {
      return teacher?.id ?? '';
    }
    const owner = this.owners().find((option) => option.subtitle === 'TENANT_ADMIN') ?? this.owners()[0];
    return owner?.id ?? '';
  }
}
