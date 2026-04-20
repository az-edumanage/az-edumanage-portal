export interface TenantUsage {
  id: string;
  name: string;
  plan: string;
  activeUsers: number;
  storageUsed: number;
  apiCalls: number;
  mostUsedModule: string;
  riskLevel: 'Low' | 'High' | 'Over Limit';
}

export interface ModuleUsage {
  name: string;
  category: 'Core' | 'Advanced';
  enabledTenants: number;
  activeTenants: number;
  usageRate: number;
  totalActions: number;
  trend: 'up' | 'down' | 'stable';
}
