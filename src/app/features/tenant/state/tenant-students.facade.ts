import { Injectable, inject } from '@angular/core';
import { TenantStudentsStore } from './tenant-students.store';

@Injectable({ providedIn: 'root' })
export class TenantStudentsFacade {
  private readonly store = inject(TenantStudentsStore);

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

  loadStudents(): void {
    this.store.loadStudents();
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
}
