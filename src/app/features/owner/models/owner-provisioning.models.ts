export type ProvisioningStatus = string;

export interface ProvisioningJob {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  triggeredBy: 'System' | 'Admin';
  createdDate: string;
  status: ProvisioningStatus;
  source: string;
  schemaName: string;
  isActive: boolean;
  error: string | null;
}

export interface TenantMigrationStatus {
  tenantId: string;
  schemaName: string;
  targetVersion: string | null;
  currentVersion: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}
