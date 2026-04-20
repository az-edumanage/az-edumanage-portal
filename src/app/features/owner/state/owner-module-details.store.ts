import { Injectable, inject, signal } from '@angular/core';
import { OwnerModuleDetailsDataService } from '../data-access/owner-module-details-data.service';
import { Feature, Limit } from '../models/owner-module-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerModuleDetailsStore {
  private readonly data = inject(OwnerModuleDetailsDataService);

  readonly activeTab = signal<'overview' | 'settings' | 'plans' | 'overrides' | 'dependencies' | 'changelog'>('overview');

  private readonly initial = this.data.getPreset('mod-students');
  readonly module = signal(this.initial.module);
  readonly features = signal<Feature[]>([...this.initial.features]);
  readonly limits = signal<Limit[]>([...this.initial.limits]);

  readonly availablePlans = this.data.availablePlans;
  readonly overrides = this.data.overrides;
  readonly dependencies = this.data.dependencies;
  readonly changeLogs = this.data.changeLogs;

  loadModuleData(id: string): void {
    const preset = this.data.getPreset(id);
    this.module.set(preset.module);
    this.features.set([...preset.features]);
    this.limits.set([...preset.limits]);
  }
}
