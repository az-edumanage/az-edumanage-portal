import { Injectable, inject } from '@angular/core';
import { TenantStagePayload } from '../data-access/tenant-educational-stages-data.service';
import { EducationalStageSort, TenantEducationalStagesStore } from './tenant-educational-stages.store';

@Injectable({ providedIn: 'root' })
export class TenantEducationalStagesFacade {
  private readonly store = inject(TenantEducationalStagesStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFilterPanel = this.store.showFilterPanel;
  readonly countryFilter = this.store.countryFilter;
  readonly sortBy = this.store.sortBy;
  readonly stages = this.store.stages;
  readonly countryOptions = this.store.countryOptions;
  readonly activeFiltersCount = this.store.activeFiltersCount;
  readonly filteredStages = this.store.filteredStages;
  readonly loading = this.store.loading;
  readonly countriesLoading = this.store.countriesLoading;
  readonly saving = this.store.saving;
  readonly deletingStageId = this.store.deletingStageId;
  readonly loadError = this.store.loadError;
  readonly countriesError = this.store.countriesError;
  readonly saveError = this.store.saveError;
  readonly deleteError = this.store.deleteError;

  setFilters(country: string, sortBy: EducationalStageSort): void {
    this.countryFilter.set(country);
    this.sortBy.set(sortBy || 'order');
  }

  clearAdvancedFilters(): void {
    this.setFilters('', 'order');
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  loadStages(): Promise<void> {
    return this.store.loadStages();
  }

  loadCountryOptions(): Promise<void> {
    return this.store.loadCountryOptions();
  }

  createStage(payload: TenantStagePayload): Promise<boolean> {
    return this.store.createStage(payload);
  }

  updateStage(stageId: string, payload: TenantStagePayload): Promise<boolean> {
    return this.store.updateStage(stageId, payload);
  }

  deleteStage(stageId: string): Promise<boolean> {
    return this.store.deleteStage(stageId);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }
}
