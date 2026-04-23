import { Injectable, inject } from '@angular/core';
import { IntegrationType } from '../models/owner-integrations.models';
import { OwnerIntegrationsListStore } from './owner-integrations-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationsListFacade {
  private readonly store = inject(OwnerIntegrationsListStore);

  readonly filter = this.store.filter;
  readonly filteredIntegrations = this.store.filteredIntegrations;

  setFilter(value: 'All' | IntegrationType): void {
    this.filter.set(value);
  }
}
