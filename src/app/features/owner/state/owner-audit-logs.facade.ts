import { Injectable, inject } from '@angular/core';
import { AuditLog } from '../models/owner-audit-logs.models';
import { OwnerAuditLogsStore } from './owner-audit-logs.store';

@Injectable({ providedIn: 'root' })
export class OwnerAuditLogsFacade {
  private readonly store = inject(OwnerAuditLogsStore);

  readonly searchQuery = this.store.searchQuery;
  readonly selectedLog = this.store.selectedLog;
  readonly filteredLogs = this.store.filteredLogs;

  selectLog(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeDetails(): void {
    this.selectedLog.set(null);
  }
}
