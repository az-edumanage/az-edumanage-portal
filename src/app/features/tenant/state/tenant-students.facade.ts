import { Injectable, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';
import { TenantStudentsStore } from './tenant-students.store';

@Injectable({ providedIn: 'root' })
export class TenantStudentsFacade {
  private readonly store = inject(TenantStudentsStore);
  private readonly data = inject(TenantStudentsDataService);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly stageFilter = this.store.stageFilter;
  readonly gradeFilter = this.store.gradeFilter;
  readonly statusFilter = this.store.statusFilter;
  readonly sortBy = this.store.sortBy;

  readonly students = this.store.students;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredStudents = this.store.filteredStudents;
  readonly pagedStudents = this.store.pagedStudents;
  readonly totalFilteredStudents = this.store.totalFilteredStudents;
  readonly totalPages = this.store.totalPages;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly deleteState = this.store.deleteState;
  readonly passwordModalStudent = this.store.passwordModalStudent;
  readonly passwordSaving = this.store.passwordSaving;
  readonly passwordError = this.store.passwordError;
  readonly passwordSuccess = this.store.passwordSuccess;
  readonly attendanceSummary = this.store.attendanceSummary;
  readonly attendanceSummaryLoading = this.store.attendanceSummaryLoading;
  readonly attendanceSummaryError = this.store.attendanceSummaryError;
  readonly attendanceFilter = this.store.attendanceFilter;
  readonly attendanceCards = this.store.attendanceCards;
  readonly attendanceFilterLabel = this.store.attendanceFilterLabel;
  readonly emptyStateTitle = this.store.emptyStateTitle;
  readonly emptyStateDescription = this.store.emptyStateDescription;

  loadStudents(): void {
    this.store.loadStudents();
    this.store.loadAttendanceSummary();
  }

  reloadAttendanceSummary(): void {
    this.store.loadAttendanceSummary();
  }

  setAttendanceFilter(value: 'all' | 'absent' | 'present'): void {
    this.store.setAttendanceFilter(value);
  }

  setFilters(stage: string, grade: string, status: string, sortBy: string): void {
    this.stageFilter.set(stage);
    this.gradeFilter.set(grade);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
    this.store.resetPage();
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.setAttendanceFilter('all');
    this.clearAdvancedFilters();
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.store.resetPage();
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

  requestDelete(studentId: string): void {
    const student = this.students().find((candidate) => candidate.id === studentId);
    if (student) {
      this.store.requestDelete(student);
    }
  }

  confirmDelete(): void {
    const student = this.deleteState().student;
    if (!student || this.deleteState().status === 'deleting') {
      return;
    }
    this.store.setDeleteDeleting();
    this.data.deleteStudent(student.id).subscribe({
      next: () => {
        this.store.removeStudent(student.id);
        this.store.setDeleteSuccess('Student deleted successfully.');
      },
      error: (error: Error) => this.store.setDeleteFailed(error.message),
    });
  }

  closeDeleteModal(): void {
    this.store.closeDeleteModal();
  }

  openPasswordModal(studentId: string): void {
    const student = this.students().find((candidate) => candidate.id === studentId);
    if (student) {
      this.store.openPasswordModal(student);
    }
  }

  closePasswordModal(): void {
    this.store.closePasswordModal();
  }

  changePassword(newPassword: string): void {
    const student = this.passwordModalStudent();
    if (!student || this.passwordSaving()) {
      return;
    }
    this.store.setPasswordSaving(true);
    this.store.setPasswordError(null);
    this.store.setPasswordSuccess(null);
    this.data
      .changeStudentPassword(student.id, newPassword)
      .pipe(finalize(() => this.store.setPasswordSaving(false)))
      .subscribe({
        next: () => {
          this.store.setPasswordSuccess('Password updated successfully');
          this.store.clampPage();
        },
        error: (error: Error) => this.store.setPasswordError(error.message),
      });
  }
}
