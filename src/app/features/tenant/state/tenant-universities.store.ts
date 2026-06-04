import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantCountry, TenantCountrySettingsService } from '../data-access/tenant-country-settings.service';
import { TenantUniversitiesDataService } from '../data-access/tenant-universities-data.service';
import { TenantUniversity, TenantUniversityPayload } from '../models/tenant-universities.models';

export type TenantUniversitySort = 'order' | 'name' | 'colleges-desc' | 'subjects-desc';

@Injectable({ providedIn: 'root' })
export class TenantUniversitiesStore {
  private readonly data = inject(TenantUniversitiesDataService);
  private readonly countrySettings = inject(TenantCountrySettingsService);

  readonly searchQuery = signal('');
  readonly countryFilter = signal('');
  readonly sortFilter = signal<TenantUniversitySort>('order');
  readonly universities = signal<TenantUniversity[]>([]);
  readonly countryOptions = signal<TenantCountry[]>([]);
  readonly loading = signal(false);
  readonly optionsLoading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly optionsError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly filteredUniversities = computed(() => {
    const sort = this.sortFilter();
    return [...this.universities()].sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sort === 'colleges-desc') {
        return b.collegeCount - a.collegeCount || a.name.localeCompare(b.name);
      }
      if (sort === 'subjects-desc') {
        return b.subjectCount - a.subjectCount || a.name.localeCompare(b.name);
      }
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
  });

  async loadUniversities(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.universities.set(await this.data.listUniversities({
        countryId: this.countryFilter(),
        search: this.searchQuery(),
      }));
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loadCountryOptions(): Promise<void> {
    this.optionsLoading.set(true);
    this.optionsError.set(null);
    try {
      this.countryOptions.set(await this.countrySettings.listCountries());
    } catch (error) {
      this.optionsError.set(this.countrySettings.toUserMessage(error));
    } finally {
      this.optionsLoading.set(false);
    }
  }

  async getUniversity(id: string): Promise<TenantUniversity | null> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      return await this.data.getUniversity(id);
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async createUniversity(payload: TenantUniversityPayload): Promise<TenantUniversity | null> {
    return this.saveUniversity(() => this.data.createUniversity(payload));
  }

  async updateUniversity(id: string, payload: TenantUniversityPayload): Promise<TenantUniversity | null> {
    return this.saveUniversity(() => this.data.updateUniversity(id, payload));
  }

  async deleteUniversity(id: string): Promise<boolean> {
    this.deletingId.set(id);
    this.deleteError.set(null);
    try {
      await this.data.deleteUniversity(id);
      this.universities.update((universities) => universities.filter((university) => university.id !== id));
      return true;
    } catch (error) {
      this.deleteError.set(this.data.toUserMessage(error, 'Unable to delete university. Please try again.'));
      return false;
    } finally {
      this.deletingId.set(null);
    }
  }

  private async saveUniversity(action: () => Promise<TenantUniversity>): Promise<TenantUniversity | null> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const saved = await action();
      await this.loadUniversities();
      return saved;
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error, 'Unable to save university. Please try again.'));
      return null;
    } finally {
      this.saving.set(false);
    }
  }
}
