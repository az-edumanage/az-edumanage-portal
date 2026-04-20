import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerAuditLogsDataService } from '../data-access/owner-audit-logs-data.service';
import { AuditLog } from '../models/owner-audit-logs.models';

@Injectable({ providedIn: 'root' })
export class OwnerAuditLogsStore {
  private readonly data = inject(OwnerAuditLogsDataService);

  readonly searchQuery = signal('');
  readonly selectedLog = signal<AuditLog | null>(null);
  readonly logs = this.data.logs;

  readonly filteredLogs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.logs().filter((log) =>
      log.userName.toLowerCase().includes(query) ||
      log.actionType.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.tenantName.toLowerCase().includes(query)
    );
  });
}
