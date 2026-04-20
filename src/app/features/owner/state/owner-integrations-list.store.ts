import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerIntegrationsDataService } from '../data-access/owner-integrations-data.service';
import { IntegrationType } from '../models/owner-integrations.models';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationsListStore {
  private readonly data = inject(OwnerIntegrationsDataService);

  readonly filter = signal<'All' | IntegrationType>('All');
  readonly integrations = this.data.integrations;

  readonly filteredIntegrations = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.integrations();
    }

    return this.integrations().filter((integration) => integration.type === currentFilter);
  });
}
