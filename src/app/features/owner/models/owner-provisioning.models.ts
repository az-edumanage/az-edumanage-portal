export type ProvisioningStatus = string;

export interface ProvisioningJob {
  id: string;
  tenantName: string;
  plan: string;
  triggeredBy: 'System' | 'Admin';
  createdDate: string;
  status: ProvisioningStatus;
  duration: string;
}
