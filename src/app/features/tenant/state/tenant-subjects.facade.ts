import { Injectable, inject } from '@angular/core';
import { TenantSubjectsStore } from './tenant-subjects.store';

@Injectable({ providedIn: 'root' })
export class TenantSubjectsFacade {
  private readonly store = inject(TenantSubjectsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly stageFilter = this.store.stageFilter;
  readonly gradeFilter = this.store.gradeFilter;
  readonly sortBy = this.store.sortBy;
  readonly subjects = this.store.subjects;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;
  readonly deleteError = this.store.deleteError;
  readonly deletingId = this.store.deletingId;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredSubjects = this.store.filteredSubjects;
  readonly stageOptions = this.store.stageOptions;
  readonly gradeOptions = this.store.gradeOptions;

  loadSubjects(): Promise<void> {
    return this.store.loadSubjects();
  }

  deleteSubject(id: string): Promise<boolean> {
    return this.store.deleteSubject(id);
  }

  setFilters(stageId: string, gradeId: string, sortBy: string): void {
    this.stageFilter.set(stageId);
    this.gradeFilter.set(gradeId);
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
