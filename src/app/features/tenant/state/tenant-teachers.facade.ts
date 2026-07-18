import { Injectable, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { TenantTeachersStore } from './tenant-teachers.store';
import { Teacher } from '../models/tenant-teachers.models';
import { TenantTeachersDataService } from '../data-access/tenant-teachers-data.service';

@Injectable({ providedIn: 'root' })
export class TenantTeachersFacade {
  private readonly store = inject(TenantTeachersStore);
  private readonly data = inject(TenantTeachersDataService);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly subjectFilter = this.store.subjectFilter;
  readonly statusFilter = this.store.statusFilter;
  readonly sortBy = this.store.sortBy;
  readonly activeSettingsId = this.store.activeSettingsId;
  readonly activeChatTeacher = this.store.activeChatTeacher;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly statusSummary = this.store.statusSummary;
  readonly isStatusSummaryLoading = this.store.isStatusSummaryLoading;
  readonly statusSummaryError = this.store.statusSummaryError;
  readonly teacherStatusFilter = this.store.teacherStatusFilter;
  readonly capacity = this.store.capacity;
  readonly isCapacityLoading = this.store.isCapacityLoading;
  readonly hasStatusFilter = this.store.hasStatusFilter;

  readonly teachers = this.store.teachers;
  readonly subjectOptions = this.store.subjectOptions;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredTeachers = this.store.filteredTeachers;
  readonly pagedTeachers = this.store.pagedTeachers;
  readonly totalFilteredTeachers = this.store.totalFilteredTeachers;
  readonly totalPages = this.store.totalPages;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly activeStatusEmptyMessage = this.store.activeStatusEmptyMessage;
  readonly passwordModalTeacher = this.store.passwordModalTeacher;
  readonly passwordSaving = this.store.passwordSaving;
  readonly passwordError = this.store.passwordError;
  readonly passwordSuccess = this.store.passwordSuccess;
  readonly deleteState = this.store.deleteState;

  loadTeachers(): void {
    this.store.setLoading(true);
    this.store.setStatusSummaryLoading(true);
    this.store.setError(null);
    this.store.setStatusSummaryError(null);
    this.data
      .listTeachers()
      .pipe(finalize(() => this.store.setLoading(false)))
      .subscribe({
        next: (teachers) => this.store.setTeachers(teachers),
        error: (error: Error) => this.store.setError(error.message),
      });
    this.data
      .statusSummary()
      .pipe(finalize(() => this.store.setStatusSummaryLoading(false)))
      .subscribe({
        next: (summary) => this.store.setStatusSummary(summary),
        error: (error: Error) => this.store.setStatusSummaryError(error.message),
      });
    this.loadCapacity();
  }

  setFilters(subject: string, status: string, sortBy: string): void {
    this.subjectFilter.set(subject);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
    this.store.resetPage();
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.store.setTeacherStatusFilter('all');
    this.clearAdvancedFilters();
  }

  selectAllTeachers(): void {
    this.store.setTeacherStatusFilter('all');
  }

  selectTeachersInGroupNow(): void {
    this.store.setTeacherStatusFilter('inGroupNow');
  }

  selectAbsentTeachers(): void {
    this.store.setTeacherStatusFilter('absence');
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.store.resetPage();
  }

  setPageIndex(value: number): void {
    this.store.setPageIndex(value);
  }

  nextPage(): void {
    this.store.setPageIndex(this.pageIndex() + 1);
  }

  previousPage(): void {
    this.store.setPageIndex(this.pageIndex() - 1);
  }

  setPageSize(value: number): void {
    this.store.setPageSize(value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }

  toggleSettings(id: string): void {
    if (this.activeSettingsId() === id) {
      this.activeSettingsId.set(null);
      return;
    }
    this.activeSettingsId.set(id);
  }

  closeSettings(): void {
    this.activeSettingsId.set(null);
  }

  openChat(teacher: Teacher): void {
    this.activeChatTeacher.set(teacher);
  }

  closeChat(): void {
    this.activeChatTeacher.set(null);
  }

  updateStatus(id: string, status: 'Active' | 'Inactive'): void {
    const teacher = this.teachers().find((item) => item.id === id);
    if (!teacher) {
      return;
    }
    this.data.updateStatus(teacher, status).subscribe({
      next: (updated) => this.store.updateTeacher(updated),
      error: (error: Error) => this.store.setError(error.message),
    });
    this.closeSettings();
  }

  openPasswordModal(teacher: Teacher): void {
    this.store.openPasswordModal(teacher);
  }

  closePasswordModal(): void {
    this.store.closePasswordModal();
  }

  changePassword(newPassword: string): void {
    const teacher = this.passwordModalTeacher();
    if (!teacher || this.passwordSaving()) {
      return;
    }
    this.store.setPasswordSaving(true);
    this.store.setPasswordError(null);
    this.store.setPasswordSuccess(null);
    this.data
      .changeTeacherPassword(teacher.id, newPassword)
      .pipe(finalize(() => this.store.setPasswordSaving(false)))
      .subscribe({
        next: () => {
          this.store.setPasswordSuccess('Password updated successfully');
          this.store.clampPage();
        },
        error: (error: Error) => this.store.setPasswordError(error.message),
      });
  }

  requestDelete(teacher: Teacher): void {
    this.store.requestDelete(teacher);
  }

  closeDeleteModal(): void {
    this.store.closeDeleteModal();
  }

  confirmDelete(): void {
    const teacher = this.deleteState().teacher;
    if (!teacher || this.deleteState().status === 'deleting') {
      return;
    }
    this.store.setDeleteDeleting();
    this.data.deleteTeacher(teacher.id).subscribe({
      next: () => {
        this.store.removeTeacher(teacher.id);
        this.store.setDeleteSuccess('Teacher deleted successfully.');
        this.loadCapacity();
      },
      error: (error: Error) => this.store.setDeleteFailed(error.message),
    });
  }

  private loadCapacity(): void {
    this.store.setCapacityLoading(true);
    this.data
      .capacity()
      .pipe(finalize(() => this.store.setCapacityLoading(false)))
      .subscribe({
        next: (capacity) => this.store.setCapacity(capacity),
        error: () => this.store.setCapacity({
          tenantType: 'CENTER',
          currentTeachers: this.teachers().length,
          maxTeachers: null,
          canCreate: true,
        }),
      });
  }
}
