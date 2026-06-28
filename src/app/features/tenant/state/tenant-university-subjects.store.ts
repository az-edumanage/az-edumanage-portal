import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantCollegesDataService } from '../data-access/tenant-colleges-data.service';
import { TenantUniversitiesDataService } from '../data-access/tenant-universities-data.service';
import { TenantUniversitySubjectsDataService } from '../data-access/tenant-university-subjects-data.service';
import { TenantCollegeOption } from '../models/tenant-colleges.models';
import { TenantUniversityOption } from '../models/tenant-universities.models';
import { TenantUniversitySubject, TenantUniversitySubjectPayload } from '../models/tenant-university-subjects.models';

@Injectable({ providedIn: 'root' })
export class TenantUniversitySubjectsStore {
  private readonly data = inject(TenantUniversitySubjectsDataService);
  private readonly universitiesData = inject(TenantUniversitiesDataService);
  private readonly collegesData = inject(TenantCollegesDataService);

  readonly searchQuery = signal('');
  readonly viewMode = signal<'grid' | 'list'>('list');
  readonly universityFilter = signal('');
  readonly collegeFilter = signal('');
  readonly subjects = signal<TenantUniversitySubject[]>([]);
  readonly universityOptions = signal<TenantUniversityOption[]>([]);
  readonly collegeOptions = signal<TenantCollegeOption[]>([]);
  readonly loading = signal(false);
  readonly optionsLoading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly optionsError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly filteredCollegeOptions = computed(() => {
    const universityId = this.universityFilter();
    return this.collegeOptions()
      .filter((college) => !universityId || college.universityId === universityId)
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly filteredSubjects = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const universityId = this.universityFilter();
    const collegeId = this.collegeFilter();
    return this.subjects()
      .filter((subject) => {
        const matchesUniversity = !universityId || subject.universityId === universityId;
        const matchesCollege = !collegeId || subject.collegeId === collegeId;
        const matchesSearch = !query
          || subject.name.toLowerCase().includes(query)
          || subject.universityName.toLowerCase().includes(query)
          || subject.collegeName.toLowerCase().includes(query)
          || (subject.description ?? '').toLowerCase().includes(query);
        return matchesUniversity && matchesCollege && matchesSearch;
      })
      .sort((a, b) => a.universityName.localeCompare(b.universityName)
        || a.collegeName.localeCompare(b.collegeName)
        || a.name.localeCompare(b.name));
  });

  async loadSubjects(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.subjects.set(await this.data.listSubjects());
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loadOptions(): Promise<void> {
    this.optionsLoading.set(true);
    this.optionsError.set(null);
    try {
      const [universities, colleges] = await Promise.all([
        this.universitiesData.listUniversityOptions(),
        this.collegesData.listCollegeOptions(),
      ]);
      this.universityOptions.set(universities);
      this.collegeOptions.set(colleges);
    } catch (error) {
      this.optionsError.set(this.data.toUserMessage(error, 'Unable to load university education options. Please try again.'));
    } finally {
      this.optionsLoading.set(false);
    }
  }

  async getSubject(id: string): Promise<TenantUniversitySubject | null> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      return await this.data.getSubject(id);
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async createSubject(payload: TenantUniversitySubjectPayload): Promise<TenantUniversitySubject | null> {
    return this.saveSubject(() => this.data.createSubject(payload));
  }

  async updateSubject(id: string, payload: TenantUniversitySubjectPayload): Promise<TenantUniversitySubject | null> {
    return this.saveSubject(() => this.data.updateSubject(id, payload));
  }

  async deleteSubject(id: string): Promise<boolean> {
    this.deletingId.set(id);
    this.deleteError.set(null);
    try {
      await this.data.deleteSubject(id);
      this.subjects.update((subjects) => subjects.filter((subject) => subject.id !== id));
      return true;
    } catch (error) {
      this.deleteError.set(this.data.toUserMessage(error, 'Unable to delete university subject. Please try again.'));
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }

  private async saveSubject(action: () => Promise<TenantUniversitySubject>): Promise<TenantUniversitySubject | null> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const saved = await action();
      await this.loadSubjects();
      return saved;
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error, 'Unable to save university subject. Please try again.'));
      return null;
    } finally {
      this.saving.set(false);
    }
  }
}
