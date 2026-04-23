import { Injectable, inject } from '@angular/core';
import { OwnerMonitoringStore } from './owner-monitoring.store';

@Injectable({ providedIn: 'root' })
export class OwnerMonitoringFacade {
  private readonly store = inject(OwnerMonitoringStore);

  readonly alerts = this.store.alerts;
  readonly tenantHealth = this.store.tenantHealth;
  readonly logs = this.store.logs;
}
