import { Injectable, inject, signal } from '@angular/core';
import { OwnerModule } from '../models/owner-modules.models';
import { ModuleCatalogFeature, OwnerModuleCatalogApiService } from './owner-modulecatalog-api.service';

@Injectable({ providedIn: 'root' })
export class OwnerModulesDataService {
  private readonly api = inject(OwnerModuleCatalogApiService);

  readonly modules = signal<OwnerModule[]>([]);
  readonly features = signal<ModuleCatalogFeature[]>([]);

  constructor() {
    void this.refreshModules();
    void this.refreshFeatures();
  }

  async createModule(payload: {
    nameEn: string;
    nameAr: string;
    description: string;
    category: OwnerModule['category'];
    status: OwnerModule['status'];
    includedInPlans: string[];
    featureIds: string[];
  }): Promise<void> {
    await this.api.createModule({
      nameAr: payload.nameAr.trim(),
      nameEn: payload.nameEn.trim(),
      description: payload.description.trim(),
      category: payload.category,
      status: payload.status,
      plans: payload.includedInPlans,
      featureIds: payload.featureIds,
    });
    await this.refreshModules();
  }

  async refreshModules(): Promise<void> {
    const modules = await this.api.listModules();
    this.modules.set(modules);
  }

  async updateModule(payload: {
    id: string;
    nameEn: string;
    nameAr: string;
    description: string;
    category: OwnerModule['category'];
    status: OwnerModule['status'];
    includedInPlans: string[];
    featureIds: string[];
  }): Promise<void> {
    await this.api.updateModule(payload.id, {
      nameAr: payload.nameAr.trim(),
      nameEn: payload.nameEn.trim(),
      description: payload.description.trim(),
      category: payload.category,
      status: payload.status,
      plans: payload.includedInPlans,
      featureIds: payload.featureIds,
    });
    await this.refreshModules();
  }

  async deleteModule(id: string): Promise<void> {
    await this.api.deleteModule(id);
    await this.refreshModules();
  }

  async refreshFeatures(): Promise<void> {
    const features = await this.api.listFeatures();
    this.features.set(features);
  }

  async getModule(id: string): Promise<OwnerModule> {
    return this.api.getModule(id);
  }
}
