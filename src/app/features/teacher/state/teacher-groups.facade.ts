import { Injectable, inject } from '@angular/core';
import { TeacherGroupsStore, TeacherGroupsViewMode } from './teacher-groups.store';

@Injectable({ providedIn: 'root' })
export class TeacherGroupsFacade {
  private readonly store = inject(TeacherGroupsStore);

  readonly groups = this.store.groups;
  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly failed = this.store.failed;
  readonly empty = this.store.empty;
  readonly errorMessage = this.store.errorMessage;
  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly subjectOptions = this.store.subjectOptions;
  readonly educationOptions = this.store.educationOptions;
  readonly statusOptions = this.store.statusOptions;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredGroups = this.store.filteredGroups;
  readonly noFilteredResults = this.store.noFilteredResults;
  readonly pagedGroups = this.store.pagedGroups;
  readonly totalFilteredGroups = this.store.totalFilteredGroups;
  readonly totalPages = this.store.totalPages;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;

  loadGroups(): void {
    this.store.loadGroups();
  }

  retry(): void {
    this.store.retry();
  }

  setSearchQuery(value: string): void {
    this.store.setSearchQuery(value);
  }

  setFilters(subject: string, education: string, status: string, sortBy: string): void {
    this.store.setFilters(subject, education, status, sortBy);
  }

  clearAdvancedFilters(): void {
    this.store.clearAdvancedFilters();
  }

  clearAllFilters(): void {
    this.store.clearAllFilters();
  }

  setViewMode(value: TeacherGroupsViewMode): void {
    this.viewMode.set(value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
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
}
