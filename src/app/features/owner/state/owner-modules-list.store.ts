import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerModulesDataService } from '../data-access/owner-modules-data.service';
import { ModuleCategory } from '../models/owner-modules.models';

@Injectable({ providedIn: 'root' })
export class OwnerModulesListStore {
  private readonly data = inject(OwnerModulesDataService);

  readonly filter = signal<'All' | ModuleCategory>('All');
  readonly modules = this.data.modules;

  readonly filteredModules = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.modules();
    }

    return this.modules().filter((moduleItem) => moduleItem.category === currentFilter);
  });
}
