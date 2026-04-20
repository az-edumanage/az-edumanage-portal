import { Injectable, inject } from '@angular/core';
import { OwnerAcademicStructureDetailsStore } from './owner-academic-structure-details.store';

@Injectable({ providedIn: 'root' })
export class OwnerAcademicStructureDetailsFacade {
  private readonly store = inject(OwnerAcademicStructureDetailsStore);

  readonly activeTab = this.store.activeTab;
  readonly tabs = this.store.tabs;
  readonly features = this.store.features;
  readonly limits = this.store.limits;
  readonly availablePlans = this.store.availablePlans;
  readonly overrides = this.store.overrides;
  readonly changeLogs = this.store.changeLogs;
}
