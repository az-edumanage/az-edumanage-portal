import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UiPagerButtonComponent } from '../../../../shared/ui';
import { AuditLog } from '../../models/owner-audit-logs.models';
import { OwnerAuditLogsFacade } from '../../state/owner-audit-logs.facade';

@Component({
  selector: 'app-owner-audit-logs',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, UiPagerButtonComponent],
  templateUrl: './owner-audit-logs.component.html',
  styleUrl: './owner-audit-logs.component.css'})
export class OwnerAuditLogsComponent {
  private readonly facade = inject(OwnerAuditLogsFacade);

  readonly searchQuery = this.facade.searchQuery;
  readonly selectedLog = this.facade.selectedLog;
  readonly filteredLogs = this.facade.filteredLogs;

  selectLog(log: AuditLog): void {
    this.facade.selectLog(log);
  }

  closeDetails(): void {
    this.facade.closeDetails();
  }
}
