import { Injectable, inject } from '@angular/core';
import { OwnerMonitoringDataService } from '../data-access/owner-monitoring-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerMonitoringStore {
  private readonly data = inject(OwnerMonitoringDataService);

  readonly alerts = this.data.alerts;
  readonly tenantHealth = this.data.tenantHealth;
  readonly logs = this.data.logs;
}
