import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UiPagerButtonComponent } from '../../../shared/ui';

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  tenantName: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
  details: {
    description: string;
    oldValue?: string | object;
    newValue?: string | object;
    deviceInfo: string;
    correlationId: string;
    requestId: string;
  };
}

@Component({
  selector: 'app-owner-audit-logs',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, UiPagerButtonComponent],
  templateUrl: './owner-audit-logs.component.html',
  styleUrl: './owner-audit-logs.component.css'})
export class OwnerAuditLogsComponent {
  searchQuery = signal('');
  selectedLog = signal<AuditLog | null>(null);

  logs = signal<AuditLog[]>([
    {
      id: 'log-10234',
      timestamp: '2026-02-21 12:15:30',
      userName: 'Ahmed Hassan',
      userRole: 'Super Admin',
      actionType: 'Update',
      entityType: 'Security Policy',
      entityId: 'pol-auth',
      tenantName: 'Platform',
      ipAddress: '192.168.1.45',
      status: 'Success',
      details: {
        description: 'Updated password complexity requirements.',
        oldValue: { minLength: 8, requireSpecialChars: false },
        newValue: { minLength: 12, requireSpecialChars: true },
        deviceInfo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
        correlationId: 'corr-abc-123',
        requestId: 'req-xyz-789'
      }
    },
    {
      id: 'log-10233',
      timestamp: '2026-02-21 11:45:12',
      userName: 'Sarah Miller',
      userRole: 'Support Agent',
      actionType: 'Login',
      entityType: 'User Session',
      entityId: 'sess-998',
      tenantName: 'Platform',
      ipAddress: '10.0.0.5',
      status: 'Failed',
      details: {
        description: 'Failed login attempt (Invalid credentials).',
        deviceInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        correlationId: 'corr-def-456',
        requestId: 'req-uvw-012'
      }
    },
    {
      id: 'log-10232',
      timestamp: '2026-02-21 10:30:00',
      userName: 'System',
      userRole: 'System',
      actionType: 'Create',
      entityType: 'Backup',
      entityId: 'bkp-daily-01',
      tenantName: 'Cairo Math Center',
      ipAddress: '127.0.0.1',
      status: 'Success',
      details: {
        description: 'Daily database backup completed.',
        newValue: { size: '4.5GB', location: 's3://backups/cairo-math/...' },
        deviceInfo: 'System Worker Process',
        correlationId: 'corr-sys-777',
        requestId: 'req-job-888'
      }
    },
    {
      id: 'log-10231',
      timestamp: '2026-02-21 09:15:22',
      userName: 'John Doe',
      userRole: 'Billing Manager',
      actionType: 'Update',
      entityType: 'Subscription',
      entityId: 'sub-554',
      tenantName: 'Future Academy',
      ipAddress: '172.16.0.22',
      status: 'Success',
      details: {
        description: 'Extended trial period by 7 days.',
        oldValue: { trialEnds: '2026-02-28' },
        newValue: { trialEnds: '2026-03-07' },
        deviceInfo: 'Mozilla/5.0 (X11; Linux x86_64)...',
        correlationId: 'corr-bil-333',
        requestId: 'req-api-444'
      }
    }
  ]);

  filteredLogs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.logs().filter(log => 
      log.userName.toLowerCase().includes(query) ||
      log.actionType.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.tenantName.toLowerCase().includes(query)
    );
  });

  selectLog(log: AuditLog) {
    this.selectedLog.set(log);
  }

  closeDetails() {
    this.selectedLog.set(null);
  }
}
