import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerModuleCatalogApiService } from './owner-modulecatalog-api.service';

export interface OwnerModuleFeatureSetting {
  id: string;
  nameAr: string;
  nameEn: string;
  moduleCategory: string;
  price: number;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class OwnerModuleFeaturesSettingsDataService {
  private readonly moduleCatalogApi = inject(OwnerModuleCatalogApiService);

  private readonly featuresState = signal<OwnerModuleFeatureSetting[]>([]);
  private readonly loadingState = signal(false);

  readonly features = computed(() => this.featuresState());
  readonly loading = computed(() => this.loadingState());

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loadingState.set(true);
    try {
      const features = await this.moduleCatalogApi.listFeatures();
      this.featuresState.set(
        features.map((item) => ({
          id: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          moduleCategory: item.moduleCategory,
          price: item.price,
          enabled: item.active,
        })),
      );
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateFeature(payload: OwnerModuleFeatureSetting): Promise<void> {
    const updated = await this.moduleCatalogApi.updateFeature(payload.id, {
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      moduleCategory: payload.moduleCategory,
      price: payload.price,
      active: payload.enabled,
    });

    this.featuresState.update((current) =>
      current.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              nameAr: updated.nameAr,
              nameEn: updated.nameEn,
              moduleCategory: updated.moduleCategory,
              price: updated.price,
              enabled: updated.active,
            }
          : item,
      ),
    );
  }

  async createFeature(payload: Omit<OwnerModuleFeatureSetting, 'id'>): Promise<void> {
    const created = await this.moduleCatalogApi.createFeature({
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      moduleCategory: payload.moduleCategory,
      price: payload.price,
      active: payload.enabled,
    });

    this.featuresState.update((current) => [
      {
        id: created.id,
        nameAr: created.nameAr,
        nameEn: created.nameEn,
        moduleCategory: created.moduleCategory,
        price: created.price,
        enabled: created.active,
      },
      ...current,
    ]);
  }

  async deleteFeature(id: string): Promise<void> {
    await this.moduleCatalogApi.deleteFeature(id);
    this.featuresState.update((current) => current.filter((item) => item.id !== id));
  }

  async toggleFeature(id: string, enabled: boolean): Promise<void> {
    const current = this.featuresState().find((item) => item.id === id);
    if (!current) return;
    await this.updateFeature({ ...current, enabled });
  }
}
