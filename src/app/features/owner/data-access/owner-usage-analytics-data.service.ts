import { Injectable, signal } from '@angular/core';
import { ModuleUsage, TenantUsage } from '../models/owner-usage-analytics.models';

@Injectable({ providedIn: 'root' })
export class OwnerUsageAnalyticsDataService {
  readonly modules = signal<ModuleUsage[]>([
    { name: 'Students Management', category: 'Core', enabledTenants: 124, activeTenants: 120, usageRate: 98, totalActions: 15400, trend: 'up' },
    { name: 'Exams & Grades', category: 'Advanced', enabledTenants: 85, activeTenants: 82, usageRate: 96, totalActions: 8500, trend: 'up' },
    { name: 'Academic Structure', category: 'Core', enabledTenants: 124, activeTenants: 124, usageRate: 100, totalActions: 2200, trend: 'stable' },
    { name: 'Finance', category: 'Advanced', enabledTenants: 42, activeTenants: 35, usageRate: 83, totalActions: 1200, trend: 'up' },
    { name: 'SMS Integration', category: 'Advanced', enabledTenants: 20, activeTenants: 5, usageRate: 25, totalActions: 300, trend: 'down' },
  ]);

  readonly tenants = signal<TenantUsage[]>([
    { id: 't1', name: 'Cairo Math Center', plan: 'Enterprise', activeUsers: 1200, storageUsed: 45, apiCalls: 150000, mostUsedModule: 'Exams', riskLevel: 'Low' },
    { id: 't2', name: 'Elite Tutors', plan: 'Professional', activeUsers: 450, storageUsed: 12, apiCalls: 45000, mostUsedModule: 'Students', riskLevel: 'Low' },
    { id: 't3', name: 'Future Academy', plan: 'Starter', activeUsers: 150, storageUsed: 4.8, apiCalls: 12000, mostUsedModule: 'Scheduling', riskLevel: 'High' },
    { id: 't4', name: 'Alpha School', plan: 'Professional', activeUsers: 800, storageUsed: 22, apiCalls: 89000, mostUsedModule: 'Finance', riskLevel: 'Low' },
    { id: 't5', name: 'Beta Learning', plan: 'Starter', activeUsers: 200, storageUsed: 5.2, apiCalls: 5000, mostUsedModule: 'Students', riskLevel: 'Over Limit' },
  ]);
}
