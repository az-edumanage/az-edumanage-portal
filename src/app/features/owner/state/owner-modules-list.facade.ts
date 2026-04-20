import { Injectable, inject } from '@angular/core';
import { ModuleCategory } from '../models/owner-modules.models';
import { OwnerModulesListStore } from './owner-modules-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerModulesListFacade {
  private readonly store = inject(OwnerModulesListStore);

  readonly filter = this.store.filter;
  readonly filteredModules = this.store.filteredModules;

  setFilter(value: 'All' | ModuleCategory): void {
    this.filter.set(value);
  }
}
