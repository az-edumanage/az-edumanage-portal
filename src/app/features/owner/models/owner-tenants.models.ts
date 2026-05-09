export type TenantStatus = string;
export type TenantHealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type TenantType = 'center' | 'teacher';
export type TenantSubscriptionType = 'trial' | 'production';
export type TenantCreatedBy = 'system' | 'admin';

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
  subscriptionType: TenantSubscriptionType;
  createdBy: TenantCreatedBy;
}
