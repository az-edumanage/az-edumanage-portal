import { Injectable, inject } from '@angular/core';
import { TenantGroupsStore } from './tenant-groups.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupsFacade {
  private readonly store = inject(TenantGroupsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly scheduleSummary = this.store.scheduleSummary;
  readonly scheduleSummaryLoading = this.store.scheduleSummaryLoading;
  readonly scheduleSummaryError = this.store.scheduleSummaryError;
  readonly scheduleFilter = this.store.scheduleFilter;
  readonly activeScheduleFilterLabel = this.store.activeScheduleFilterLabel;
  readonly hasScheduleFilter = this.store.hasScheduleFilter;
  readonly subjectFilter = this.store.subjectFilter;
  readonly teacherFilter = this.store.teacherFilter;
  readonly sortBy = this.store.sortBy;

  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly groups = this.store.groups;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredGroups = this.store.filteredGroups;
  readonly pagedGroups = this.store.pagedGroups;
  readonly totalFilteredGroups = this.store.totalFilteredGroups;
  readonly totalPages = this.store.totalPages;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly deleteState = this.store.deleteState;

  loadGroups(): void {
    this.store.loadGroups();
  }

  loadScheduleSummary(): void {
    this.store.loadScheduleSummary();
  }

  setFilters(subject: string, teacher: string, sortBy: string): void {
    this.subjectFilter.set(subject);
    this.teacherFilter.set(teacher);
    this.sortBy.set(sortBy || 'name');
    this.store.resetPage();
  }

  clearAdvancedFilters(): void {
    this.setFilters('', '', 'name');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.store.selectScheduleFilter('all');
    this.clearAdvancedFilters();
  }

  selectScheduleFilter(filter: 'all' | 'today' | 'running' | 'postponed'): void {
    this.store.selectScheduleFilter(filter);
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

  requestDelete(groupId: string): void {
    const group = this.store.groups().find((candidate) => candidate.id === groupId);
    if (!group) {
      return;
    }

    this.store.requestDelete(group);
  }

  closeDeleteModal(): void {
    this.store.closeDeleteModal();
  }

  confirmDelete(): void {
    this.store.confirmDelete();
  }
}
