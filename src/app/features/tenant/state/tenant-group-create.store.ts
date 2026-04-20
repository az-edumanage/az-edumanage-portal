import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantGroupCreateStore {
  readonly isSubmitting = signal(false);
  readonly groupId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.groupId());
  readonly selectedDays = signal<string[]>([]);

  readonly showOwnedByDropdown = signal(false);
  readonly showTeacherDropdown = signal(false);
  readonly showGradeDropdown = signal(false);
  readonly showSubjectDropdown = signal(false);
  readonly showRoomDropdown = signal(false);

  readonly teacherSearchQuery = signal('');
  readonly gradeSearchQuery = signal('');
  readonly subjectSearchQuery = signal('');
  readonly roomSearchQuery = signal('');

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setGroupId(value: string | null): void {
    this.groupId.set(value);
  }

  setSelectedDays(days: string[]): void {
    this.selectedDays.set(days);
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

  closeAllDropdownsExcept(except: 'ownedBy' | 'teacher' | 'grade' | 'subject' | 'room'): void {
    if (except !== 'ownedBy') this.showOwnedByDropdown.set(false);
    if (except !== 'teacher') this.showTeacherDropdown.set(false);
    if (except !== 'grade') this.showGradeDropdown.set(false);
    if (except !== 'subject') this.showSubjectDropdown.set(false);
    if (except !== 'room') this.showRoomDropdown.set(false);
  }
}
