import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantCollegePayload } from '../models/tenant-colleges.models';
import { TenantCollegesStore } from './tenant-colleges.store';

@Injectable({ providedIn: 'root' })
export class TenantCollegesFacade {
  private readonly store = inject(TenantCollegesStore);
  private readonly router = inject(Router);

  readonly searchQuery = this.store.searchQuery;
  readonly universityFilter = this.store.universityFilter;
  readonly colleges = this.store.colleges;
  readonly filteredColleges = this.store.filteredColleges;
  readonly universityOptions = this.store.universityOptions;
  readonly loading = this.store.loading;
  readonly optionsLoading = this.store.optionsLoading;
  readonly saving = this.store.saving;
  readonly loadError = this.store.loadError;
  readonly optionsError = this.store.optionsError;
  readonly saveError = this.store.saveError;
  readonly deleteError = this.store.deleteError;
  readonly deletingId = this.store.deletingId;

  loadColleges = this.store.loadColleges.bind(this.store);
  loadUniversityOptions = this.store.loadUniversityOptions.bind(this.store);
  getCollege = this.store.getCollege.bind(this.store);
  createCollege = this.store.createCollege.bind(this.store);
  updateCollege = this.store.updateCollege.bind(this.store);
  deleteCollege = this.store.deleteCollege.bind(this.store);

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  setUniversityFilter(universityId: string): void {
    this.universityFilter.set(universityId);
  }

  goToList(): Promise<boolean> {
    return this.router.navigate(['/tenant/colleges']);
  }

  goToCreate(): Promise<boolean> {
    return this.router.navigate(['/tenant/colleges/create']);
  }

  goToEdit(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/colleges', id, 'edit']);
  }

  goToDetails(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/colleges', id]);
  }

  save(id: string | null, payload: TenantCollegePayload) {
    return id ? this.updateCollege(id, payload) : this.createCollege(payload);
  }
}
