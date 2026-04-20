import { Injectable, inject } from '@angular/core';
import { TenantGradesStore } from './tenant-grades.store';

@Injectable({ providedIn: 'root' })
export class TenantGradesFacade {
  private readonly store = inject(TenantGradesStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly levelFilter = this.store.levelFilter;
  readonly minStudentsFilter = this.store.minStudentsFilter;
  readonly maxStudentsFilter = this.store.maxStudentsFilter;
  readonly sortBy = this.store.sortBy;

  readonly grades = this.store.grades;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredGrades = this.store.filteredGrades;

  setFilters(level: string, minStudents: number | null, maxStudents: number | null, sortBy: string): void {
    this.levelFilter.set(level);
    this.minStudentsFilter.set(minStudents);
    this.maxStudentsFilter.set(maxStudents);
    this.sortBy.set(sortBy || 'name');
  }

  clearAdvancedFilters(): void {
    this.setFilters('', null, null, 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }
}
