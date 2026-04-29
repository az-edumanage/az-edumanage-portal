export type TenantStatus = 'Active' | 'Suspended' | 'Trial' | 'Past Due' | 'Cancelled';
export type TenantHealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type TenantType = 'Educational Center' | 'Individual Teacher';

export interface Tenant {
  id: string;
  name: string;
  fullName: string;
  phoneNumber: string;
  status: TenantStatus;
  plan: string;
  createdDate: string;
  ownerEmail: string;
  healthStatus: TenantHealthStatus;
  tenantType: TenantType;
}
