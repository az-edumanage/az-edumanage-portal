import { Injectable, inject } from '@angular/core';
import { OwnerModuleCatalogApiService } from './owner-modulecatalog-api.service';
import { Feature } from '../models/owner-module-details.models';
import { OwnerModule } from '../models/owner-modules.models';

@Injectable({ providedIn: 'root' })
export class OwnerModuleDetailsDataService {
  private readonly api = inject(OwnerModuleCatalogApiService);

  async loadModuleDetails(moduleId: string): Promise<{ module: OwnerModule; features: Feature[] }> {
    const [module, catalog] = await Promise.all([
      this.api.getModule(moduleId),
      this.api.listFeatures(),
    ]);

    const selected = new Set(module.featureIds ?? []);
    const features = catalog
      .filter((item) => selected.has(item.id))
      .map((item) => ({
        id: item.id,
        label: item.nameEn,
        enabled: true,
      }));

    return { module, features };
  }
}
