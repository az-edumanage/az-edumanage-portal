import { Injectable, inject, signal } from '@angular/core';
import { OwnerModuleDetailsDataService } from '../data-access/owner-module-details-data.service';
import { AvailablePlan, ChangeLog, Feature, Limit, TenantOverride } from '../models/owner-module-details.models';
import { OwnerModule } from '../models/owner-modules.models';

@Injectable({ providedIn: 'root' })
export class OwnerModuleDetailsStore {
  private readonly data = inject(OwnerModuleDetailsDataService);

  readonly activeTab = signal<'overview' | 'settings' | 'overrides' | 'changelog'>('overview');
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly module = signal<OwnerModule>({
    id: '',
    name: '',
    code: '',
    description: '',
    category: 'Core Business',
    status: 'Enabled',
    price: 0,
    activeTenantsCount: 0,
    lastUpdated: 'Just now',
    includedInPlans: [],
    featureIds: [],
    icon: 'extension',
  });
  readonly features = signal<Feature[]>([]);
  readonly limits = signal<Limit[]>([]);

  readonly availablePlans: AvailablePlan[] = [];
  readonly overrides: TenantOverride[] = [];
  readonly changeLogs: ChangeLog[] = [];

  async loadModuleData(id: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const result = await this.data.loadModuleDetails(id);
      this.module.set(result.module);
      this.features.set(result.features);
      this.limits.set([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load module details';
      this.loadError.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
