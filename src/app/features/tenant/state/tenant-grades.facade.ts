import { Injectable, inject } from '@angular/core';
import { TenantGradesStore } from './tenant-grades.store';

@Injectable({ providedIn: 'root' })
export class TenantGradesFacade {
  private readonly store = inject(TenantGradesStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly levelFilter = this.store.levelFilter;
  readonly stageFilter = this.store.stageFilter;
  readonly minStudentsFilter = this.store.minStudentsFilter;
  readonly maxStudentsFilter = this.store.maxStudentsFilter;
  readonly sortBy = this.store.sortBy;

  readonly grades = this.store.grades;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredGrades = this.store.filteredGrades;
  readonly levelOptions = this.store.levelOptions;
  readonly deleteState = this.store.deleteState;

  loadGrades(): Promise<void> {
    return this.store.loadGrades();
  }

  setFilters(level: string, minStudents: number | null, maxStudents: number | null, sortBy: string): void {
    this.levelFilter.set(level);
    this.minStudentsFilter.set(minStudents);
    this.maxStudentsFilter.set(maxStudents);
    this.sortBy.set(sortBy || 'name');
  }

  setStageFilter(stageId: string): void {
    this.stageFilter.set(stageId);
  }

  clearAdvancedFilters(): void {
    this.setFilters('', null, null, 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.stageFilter.set('');
    this.clearAdvancedFilters();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }

  openDeleteConfirmation = this.store.openDeleteConfirmation.bind(this.store);

  cancelDelete = this.store.cancelDelete.bind(this.store);

  closeDeleteModal = this.store.closeDeleteModal.bind(this.store);

  confirmDelete = this.store.confirmDelete.bind(this.store);
}
