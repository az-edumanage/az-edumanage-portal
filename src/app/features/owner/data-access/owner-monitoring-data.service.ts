import { Injectable, signal } from '@angular/core';
import { Alert, LogEntry, TenantHealth } from '../models/owner-monitoring.models';

@Injectable({ providedIn: 'root' })
export class OwnerMonitoringDataService {
  readonly alerts = signal<Alert[]>([
    { id: 'a1', title: 'High Database Latency', severity: 'Critical', timestamp: '10 mins ago', status: 'Open', assignedTo: 'DevOps Team' },
    { id: 'a2', title: 'Storage Limit Approaching - Tenant T-102', severity: 'Warning', timestamp: '1 hour ago', status: 'Acknowledged', assignedTo: 'Support' },
    { id: 'a3', title: 'API Rate Limit Spike', severity: 'Info', timestamp: '2 hours ago', status: 'Resolved', assignedTo: 'System' },
  ]);

  readonly tenantHealth = signal<TenantHealth[]>([
    { name: 'Cairo Math Center', plan: 'Enterprise', storageUsed: '45 GB', apiUsage: 'High', errorCount: 2, status: 'Healthy' },
    { name: 'Future Academy', plan: 'Starter', storageUsed: '4.8 GB', apiUsage: 'Medium', errorCount: 15, status: 'Degraded' },
    { name: 'Elite Tutors', plan: 'Professional', storageUsed: '12 GB', apiUsage: 'Low', errorCount: 0, status: 'Healthy' },
    { name: 'Beta Learning', plan: 'Starter', storageUsed: '5.2 GB', apiUsage: 'Low', errorCount: 45, status: 'Critical' },
  ]);

  readonly logs = signal<LogEntry[]>([
    { id: 'l1', timestamp: '2026-02-21 11:50:05', level: 'Info', tenant: 'System', message: 'Scheduled backup completed successfully.' },
    { id: 'l2', timestamp: '2026-02-21 11:48:12', level: 'Error', tenant: 'Beta Learning', message: 'Payment gateway timeout: Connection refused.' },
    { id: 'l3', timestamp: '2026-02-21 11:45:30', level: 'Warning', tenant: 'Future Academy', message: 'Slow query detected on Students table (1200ms).' },
    { id: 'l4', timestamp: '2026-02-21 11:42:10', level: 'Info', tenant: 'Cairo Math Center', message: 'User batch import started.' },
    { id: 'l5', timestamp: '2026-02-21 11:40:00', level: 'Info', tenant: 'System', message: 'Health check passed for all services.' },
  ]);
}
