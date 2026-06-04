import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantUniversityPayload } from '../models/tenant-universities.models';
import { TenantUniversitySort } from './tenant-universities.store';
import { TenantUniversitiesStore } from './tenant-universities.store';

@Injectable({ providedIn: 'root' })
export class TenantUniversitiesFacade {
  private readonly store = inject(TenantUniversitiesStore);
  private readonly router = inject(Router);

  readonly searchQuery = this.store.searchQuery;
  readonly countryFilter = this.store.countryFilter;
  readonly sortFilter = this.store.sortFilter;
  readonly universities = this.store.universities;
  readonly filteredUniversities = this.store.filteredUniversities;
  readonly countryOptions = this.store.countryOptions;
  readonly loading = this.store.loading;
  readonly optionsLoading = this.store.optionsLoading;
  readonly saving = this.store.saving;
  readonly loadError = this.store.loadError;
  readonly optionsError = this.store.optionsError;
  readonly saveError = this.store.saveError;
  readonly deleteError = this.store.deleteError;
  readonly deletingId = this.store.deletingId;

  loadUniversities = this.store.loadUniversities.bind(this.store);
  loadCountryOptions = this.store.loadCountryOptions.bind(this.store);
  getUniversity = this.store.getUniversity.bind(this.store);
  createUniversity = this.store.createUniversity.bind(this.store);
  updateUniversity = this.store.updateUniversity.bind(this.store);
  deleteUniversity = this.store.deleteUniversity.bind(this.store);

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  setCountryFilter(countryId: string): void {
    this.countryFilter.set(countryId);
  }

  setSortFilter(sort: TenantUniversitySort): void {
    this.sortFilter.set(sort);
  }

  goToList(): Promise<boolean> {
    return this.router.navigate(['/tenant/universities']);
  }

  goToCreate(): Promise<boolean> {
    return this.router.navigate(['/tenant/universities']);
  }

  goToEdit(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/universities', id, 'edit']);
  }

  goToDetails(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/universities', id]);
  }

  save(id: string | null, payload: TenantUniversityPayload) {
    return id ? this.updateUniversity(id, payload) : this.createUniversity(payload);
  }
}
