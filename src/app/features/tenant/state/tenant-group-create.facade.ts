import { Injectable, computed, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupCreateDataService } from '../data-access/tenant-group-create-data.service';
import { TenantGroupTaskData, TenantGroupPayload } from '../models/tenant-group-create.models';
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
  readonly groupId = this.store.groupId;
  readonly isEditMode = this.store.isEditMode;
  readonly selectedDays = this.store.selectedDays;

  readonly showOwnedByDropdown = this.store.showOwnedByDropdown;
  readonly showTeacherDropdown = this.store.showTeacherDropdown;
  readonly showGradeDropdown = this.store.showGradeDropdown;
  readonly showSubjectDropdown = this.store.showSubjectDropdown;
  readonly showRoomDropdown = this.store.showRoomDropdown;

  readonly teacherSearchQuery = this.store.teacherSearchQuery;
  readonly gradeSearchQuery = this.store.gradeSearchQuery;
  readonly subjectSearchQuery = this.store.subjectSearchQuery;
  readonly roomSearchQuery = this.store.roomSearchQuery;

  readonly teachers = this.data.teachers;
  readonly grades = this.data.grades;
  readonly subjects = this.data.subjects;
  readonly rooms = this.data.rooms;

  readonly groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    grade: ['Grade 12', Validators.required],
    subject: ['Physics', Validators.required],
    teacher: ['Dr. Ahmed Zewail', Validators.required],
    ownedBy: ['', Validators.required],
    room: ['Lab 101', Validators.required],
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
    if (!query) return this.teachers;
    return this.teachers.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  readonly filteredGrades = computed(() => {
    const query = this.gradeSearchQuery().toLowerCase();
    if (!query) return this.grades;
    return this.grades.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  readonly filteredSubjects = computed(() => {
    const query = this.subjectSearchQuery().toLowerCase();
    if (!query) return this.subjects;
    return this.subjects.filter((item) => item.name.toLowerCase().includes(query));
  });

  readonly filteredRooms = computed(() => {
    const query = this.roomSearchQuery().toLowerCase();
    if (!query) return this.rooms;
    return this.rooms.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  initialize(groupId: string | null): void {
    if (groupId) {
      this.store.setGroupId(groupId);
      this.taskId = `edit-group-${groupId}`;
      this.groupForm.patchValue({
        name: 'Physics G12-A',
        grade: 'Grade 12',
        subject: 'Physics',
        teacher: 'Dr. Ahmed Zewail',
        room: 'Lab 101',
        capacity: 30,
        fees: 500,
      });
      this.store.setSelectedDays(['Monday', 'Wednesday']);
    } else {
      this.store.setGroupId(null);
      this.taskId = 'create-group-task';
    }

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

  onDestroy(): void {
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
  }

  toggleOwnedByDropdown(): void {
    const next = !this.showOwnedByDropdown();
    this.store.setOwnedByDropdownOpen(next);
    if (next) {
      this.store.closeAllDropdownsExcept('ownedBy');
    }
  }

  selectOwnedBy(value: string): void {
    this.groupForm.patchValue({ ownedBy: value });
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
    this.groupForm.patchValue({ grade: value });
    this.store.setGradeDropdownOpen(false);
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
  }

  setTeacherSearchQuery(value: string): void {
    this.teacherSearchQuery.set(value);
  }

  setGradeSearchQuery(value: string): void {
    this.gradeSearchQuery.set(value);
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
      .createOrUpdateGroup(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.router.navigate(['/tenant/groups']);
      });
  }
}
