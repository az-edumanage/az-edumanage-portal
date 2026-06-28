import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitiesFacade } from '../../state/tenant-universities.facade';
import { TenantUniversitySort } from '../../state/tenant-universities.store';
import { TenantUniversityCreateComponent } from '../tenant-university-create/tenant-university-create.component';

@Component({
  selector: 'app-tenant-universities',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TenantUniversityCreateComponent],
  templateUrl: './tenant-universities.component.html',
  styleUrl: './tenant-universities.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversitiesComponent implements OnInit, OnDestroy {
  private readonly facade = inject(TenantUniversitiesFacade);
  private readonly router = inject(Router);

  readonly searchQuery = this.facade.searchQuery;
  readonly countryFilter = this.facade.countryFilter;
  readonly sortFilter = this.facade.sortFilter;
  readonly universities = this.facade.filteredUniversities;
  readonly countryOptions = this.facade.countryOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly isCreateModalOpen = signal(false);
  readonly statusModal = signal<{ title: string; message: string; icon: string } | null>(null);
  readonly showFilterPanel = signal(false);
  private searchLoadTimer: ReturnType<typeof setTimeout> | null = null;
  readonly activeFiltersCount = computed(() => (this.searchQuery().trim() ? 1 : 0) + (this.countryFilter() ? 1 : 0) + (this.sortFilter() !== 'order' ? 1 : 0));

  ngOnInit(): void {
    void this.facade.loadCountryOptions();
    void this.facade.loadUniversities();
  }

  ngOnDestroy(): void {
    if (this.searchLoadTimer) {
      clearTimeout(this.searchLoadTimer);
    }
  }

  onSearch(value: string): void {
    this.facade.setSearch(value);
    this.scheduleFilteredLoad();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((visible) => !visible);
  }

  onCountryFilter(countryId: string): void {
    this.facade.setCountryFilter(countryId);
    void this.facade.loadUniversities();
  }

  onSortFilter(sort: string): void {
    this.facade.setSortFilter((sort || 'order') as TenantUniversitySort);
  }

  clearAllFilters(): void {
    this.facade.setSearch('');
    this.facade.setCountryFilter('');
    this.facade.setSortFilter('order');
    void this.facade.loadUniversities();
  }

  clearAdvancedFilters(): void {
    this.facade.setCountryFilter('');
    this.facade.setSortFilter('order');
    void this.facade.loadUniversities();
  }

  openCreateModal(): void {
    this.statusModal.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  handleUniversitySaved(): void {
    this.closeCreateModal();
    this.statusModal.set({
      title: 'University saved',
      message: 'The university was saved successfully and is now available in the list.',
      icon: 'check_circle',
    });
    void this.facade.loadUniversities();
  }

  closeStatusModal(): void {
    this.statusModal.set(null);
  }

  deleteUniversity(id: string): void {
    void this.facade.deleteUniversity(id);
  }

  isExamsUniversityEducationRoute(): boolean {
    return this.router.url.startsWith('/tenant/exams/university-education');
  }

  openRelatedColleges(universityId: string): void {
    if (this.isExamsUniversityEducationRoute()) {
      void this.router.navigate(['/tenant/exams/university-education', universityId]);
      return;
    }
    void this.router.navigate(['/tenant/colleges'], { queryParams: { universityId } });
  }

  private scheduleFilteredLoad(): void {
    if (this.searchLoadTimer) {
      clearTimeout(this.searchLoadTimer);
    }

    this.searchLoadTimer = setTimeout(() => {
      this.searchLoadTimer = null;
      void this.facade.loadUniversities();
    }, 250);
  }
}
