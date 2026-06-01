import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantCollegesDataService } from '../data-access/tenant-colleges-data.service';
import { TenantUniversitiesDataService } from '../data-access/tenant-universities-data.service';
import { TenantCollege, TenantCollegePayload } from '../models/tenant-colleges.models';
import { TenantUniversityOption } from '../models/tenant-universities.models';

@Injectable({ providedIn: 'root' })
export class TenantCollegesStore {
  private readonly data = inject(TenantCollegesDataService);
  private readonly universitiesData = inject(TenantUniversitiesDataService);

  readonly searchQuery = signal('');
  readonly universityFilter = signal('');
  readonly colleges = signal<TenantCollege[]>([]);
  readonly universityOptions = signal<TenantUniversityOption[]>([]);
  readonly loading = signal(false);
  readonly optionsLoading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly optionsError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly filteredColleges = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const universityId = this.universityFilter();
    return this.colleges()
      .filter((college) => {
        const matchesUniversity = !universityId || college.universityId === universityId;
        const matchesSearch = !query
          || college.name.toLowerCase().includes(query)
          || college.universityName.toLowerCase().includes(query)
          || (college.description ?? '').toLowerCase().includes(query);
        return matchesUniversity && matchesSearch;
      })
      .sort((a, b) => a.universityName.localeCompare(b.universityName) || a.name.localeCompare(b.name));
  });

  async loadColleges(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.colleges.set(await this.data.listColleges());
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loadUniversityOptions(): Promise<void> {
    this.optionsLoading.set(true);
    this.optionsError.set(null);
    try {
      this.universityOptions.set(await this.universitiesData.listUniversityOptions());
    } catch (error) {
      this.optionsError.set(this.universitiesData.toUserMessage(error, 'Unable to load universities. Please try again.'));
    } finally {
      this.optionsLoading.set(false);
    }
  }

  async getCollege(id: string): Promise<TenantCollege | null> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      return await this.data.getCollege(id);
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async createCollege(payload: TenantCollegePayload): Promise<TenantCollege | null> {
    return this.saveCollege(() => this.data.createCollege(payload));
  }

  async updateCollege(id: string, payload: TenantCollegePayload): Promise<TenantCollege | null> {
    return this.saveCollege(() => this.data.updateCollege(id, payload));
  }

  async deleteCollege(id: string): Promise<boolean> {
    this.deletingId.set(id);
    this.deleteError.set(null);
    try {
      await this.data.deleteCollege(id);
      this.colleges.update((colleges) => colleges.filter((college) => college.id !== id));
      return true;
    } catch (error) {
      this.deleteError.set(this.data.toUserMessage(error, 'Unable to delete college. Please try again.'));
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }

  private async saveCollege(action: () => Promise<TenantCollege>): Promise<TenantCollege | null> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const saved = await action();
      await this.loadColleges();
      return saved;
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error, 'Unable to save college. Please try again.'));
      return null;
    } finally {
      this.saving.set(false);
    }
  }
}
