import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantUniversitySubjectPayload } from '../models/tenant-university-subjects.models';
import { TenantUniversitySubjectsStore } from './tenant-university-subjects.store';

@Injectable({ providedIn: 'root' })
export class TenantUniversitySubjectsFacade {
  private readonly store = inject(TenantUniversitySubjectsStore);
  private readonly router = inject(Router);

  readonly searchQuery = this.store.searchQuery;
  readonly viewMode = this.store.viewMode;
  readonly universityFilter = this.store.universityFilter;
  readonly collegeFilter = this.store.collegeFilter;
  readonly subjects = this.store.subjects;
  readonly filteredSubjects = this.store.filteredSubjects;
  readonly universityOptions = this.store.universityOptions;
  readonly collegeOptions = this.store.collegeOptions;
  readonly filteredCollegeOptions = this.store.filteredCollegeOptions;
  readonly loading = this.store.loading;
  readonly optionsLoading = this.store.optionsLoading;
  readonly saving = this.store.saving;
  readonly loadError = this.store.loadError;
  readonly optionsError = this.store.optionsError;
  readonly saveError = this.store.saveError;
  readonly deleteError = this.store.deleteError;
  readonly deletingId = this.store.deletingId;

  loadSubjects = this.store.loadSubjects.bind(this.store);
  loadOptions = this.store.loadOptions.bind(this.store);
  getSubject = this.store.getSubject.bind(this.store);
  createSubject = this.store.createSubject.bind(this.store);
  updateSubject = this.store.updateSubject.bind(this.store);
  deleteSubject = this.store.deleteSubject.bind(this.store);

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  setUniversityFilter(universityId: string): void {
    this.universityFilter.set(universityId);
    this.collegeFilter.set('');
  }

  setCollegeFilter(collegeId: string): void {
    this.collegeFilter.set(collegeId);
  }

  goToList(): Promise<boolean> {
    return this.router.navigate(['/tenant/university-subjects']);
  }

  goToCreate(): Promise<boolean> {
    return this.router.navigate(['/tenant/university-subjects/create']);
  }

  goToEdit(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/university-subjects', id, 'edit']);
  }

  goToDetails(id: string): Promise<boolean> {
    return this.router.navigate(['/tenant/university-subjects', id]);
  }

  save(id: string | null, payload: TenantUniversitySubjectPayload) {
    return id ? this.updateSubject(id, payload) : this.createSubject(payload);
  }
}
