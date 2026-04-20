export type ProvisioningStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export interface ProvisioningJob {
  id: string;
  tenantName: string;
  plan: string;
  triggeredBy: 'System' | 'Admin';
  createdDate: string;
  status: ProvisioningStatus;
  duration: string;
}
