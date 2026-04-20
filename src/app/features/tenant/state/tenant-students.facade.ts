import { Injectable, inject } from '@angular/core';
import { TenantStudentsStore } from './tenant-students.store';

@Injectable({ providedIn: 'root' })
export class TenantStudentsFacade {
  private readonly store = inject(TenantStudentsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly gradeFilter = this.store.gradeFilter;
  readonly statusFilter = this.store.statusFilter;
  readonly sortBy = this.store.sortBy;

  readonly students = this.store.students;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredStudents = this.store.filteredStudents;

  setFilters(grade: string, status: string, sortBy: string): void {
    this.gradeFilter.set(grade);
    this.statusFilter.set(status);
    this.sortBy.set(sortBy || 'name');
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }
}
