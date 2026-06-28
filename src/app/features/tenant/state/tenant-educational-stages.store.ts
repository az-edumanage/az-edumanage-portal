import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantEducationalStagesDataService, TenantStagePayload } from '../data-access/tenant-educational-stages-data.service';
import { EducationalStage, EducationalStageCountryOption } from '../models/tenant-educational-stages.models';

export type EducationalStageSort = 'order' | 'name' | 'grades-desc' | 'classes-desc';

@Injectable({ providedIn: 'root' })
export class TenantEducationalStagesStore {
  private readonly data = inject(TenantEducationalStagesDataService);

  readonly searchQuery = signal('');
  readonly showFilterPanel = signal(false);
  readonly countryFilter = signal('');
  readonly sortBy = signal<EducationalStageSort>('order');

  readonly stages = signal<EducationalStage[]>([]);
  readonly countryOptions = signal<EducationalStageCountryOption[]>([]);
  readonly loading = signal(false);
  readonly countriesLoading = signal(false);
  readonly countryCreating = signal(false);
  readonly saving = signal(false);
  readonly deletingStageId = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly countriesError = signal<string | null>(null);
  readonly countryCreateError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.countryFilter()) count++;
    if (this.sortBy() !== 'order') count++;
    return count;
  });

  readonly filteredStages = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const country = this.countryFilter();
    const sortBy = this.sortBy();

    const filtered = this.stages().filter((stage) => {
      const matchesSearch =
        !query ||
        stage.name.toLowerCase().includes(query) ||
        (stage.code ?? '').toLowerCase().includes(query) ||
        stage.country.toLowerCase().includes(query);
      const matchesCountry = !country || stage.countryId === country;

      return matchesSearch && matchesCountry;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'grades-desc') {
        return b.gradeCount - a.gradeCount;
      }

      if (sortBy === 'classes-desc') {
        return b.classCount - a.classCount;
      }

      return a.order - b.order || a.name.localeCompare(b.name);
    });
  });

  async loadStages(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.stages.set(await this.data.listStages());
    } catch (error) {
      this.loadError.set(this.data.toUserMessage(error));
      this.stages.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCountryOptions(): Promise<void> {
    this.countriesLoading.set(true);
    this.countriesError.set(null);
    try {
      this.countryOptions.set(await this.data.listCountryOptions());
    } catch (error) {
      this.countriesError.set(this.data.toUserMessage(error));
      this.countryOptions.set([]);
    } finally {
      this.countriesLoading.set(false);
    }
  }

  async createStage(payload: TenantStagePayload): Promise<boolean> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const created = await this.data.createStage(payload);
      this.stages.update((stages) => [...stages, created]);
      return true;
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async createCountryOption(name: string): Promise<EducationalStageCountryOption | null> {
    this.countryCreating.set(true);
    this.countryCreateError.set(null);
    try {
      const created = await this.data.createCountryOption(name);
      this.countryOptions.update((countries) => [...countries, created].sort((a, b) => a.label.localeCompare(b.label)));
      return created;
    } catch (error) {
      this.countryCreateError.set(this.data.toCountryUserMessage(error));
      return null;
    } finally {
      this.countryCreating.set(false);
    }
  }

  clearCountryCreateError(): void {
    this.countryCreateError.set(null);
  }

  async updateStage(stageId: string, payload: TenantStagePayload): Promise<boolean> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const updated = await this.data.updateStage(stageId, payload);
      this.stages.update((stages) => stages.map((stage) => stage.id === updated.id ? updated : stage));
      return true;
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStage(stageId: string): Promise<boolean> {
    this.deletingStageId.set(stageId);
    this.deleteError.set(null);
    try {
      await this.data.deleteStage(stageId);
      this.stages.update((stages) => stages.filter((stage) => stage.id !== stageId));
      return true;
    } catch (error) {
      this.deleteError.set(this.data.toUserMessage(error));
      return false;
    } finally {
      this.deletingStageId.set(null);
    }
  }
}
