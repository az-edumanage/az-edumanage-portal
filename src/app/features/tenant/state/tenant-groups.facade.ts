import { Injectable, inject } from '@angular/core';
import { TenantGroupsStore } from './tenant-groups.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupsFacade {
  private readonly store = inject(TenantGroupsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly viewMode = this.store.viewMode;
  readonly subjectFilter = this.store.subjectFilter;
  readonly teacherFilter = this.store.teacherFilter;
  readonly sortBy = this.store.sortBy;

  readonly groups = this.store.groups;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredGroups = this.store.filteredGroups;

  setFilters(subject: string, teacher: string, sortBy: string): void {
    this.subjectFilter.set(subject);
    this.teacherFilter.set(teacher);
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
