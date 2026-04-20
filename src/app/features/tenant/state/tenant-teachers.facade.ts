import { Injectable, inject } from '@angular/core';
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

  readonly teachers = this.store.teachers;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredTeachers = this.store.filteredTeachers;

  setFilters(subject: string, status: string, sortBy: string): void {
    this.subjectFilter.set(subject);
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
    this.data.updateStatus(id, status);
    this.closeSettings();
  }
}
