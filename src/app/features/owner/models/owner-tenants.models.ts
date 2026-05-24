export type ProviderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'unknown';
export type TenantOperationalStatus = 'active' | 'suspended' | 'disabled' | 'blocked' | 'pending' | 'unknown';
export type SettlementStatus = 'provider_paid' | 'manual_paid' | 'unpaid' | 'failed' | 'unknown';
export type OwnerDisplayStatus = 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked' | 'unknown';
export type TenantStatus = string;
export type TenantHealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type TenantType = 'center' | 'teacher';
export type TenantSubscriptionType = 'trial' | 'production';
export type TenantCreatedBy = 'system' | 'admin';

export const TENANT_STATUS_OPTIONS: TenantStatus[] = [
  'Pending',
  'Active',
  'Suspended',
  'Disabled',
  'Blocked',
  'Unknown',
];

export interface Tenant {
  id: string;
  name: string;
  fullName: string;
  phoneNumber: string;
  status: TenantStatus;
  ownerDisplayStatus: OwnerDisplayStatus;
  providerPaymentStatus: ProviderPaymentStatus;
  tenantOperationalStatus: TenantOperationalStatus;
  settlementStatus: SettlementStatus;
  plan: string;
  createdDate: string;
  ownerEmail: string;
  healthStatus: TenantHealthStatus;
  tenantType: TenantType;
  subscriptionType: TenantSubscriptionType;
  createdBy: TenantCreatedBy;
}

export interface ManualSettlementRequest {
  paymentTransactionRef: string | null;
  manualInvoiceRef: string;
  manualPaymentRef: string;
  amount: number;
  currency: string;
  settledAt: string;
  evidenceRef: string | null;
  evidenceNote: string | null;
  note: string | null;
}

export interface ManualSettlementSummary {
  id: string;
  tenantId: string;
  paymentTransactionRef: string | null;
  manualInvoiceRef: string;
  manualPaymentRef: string;
  amount: number;
  currency: string;
  settledAt: string;
  evidenceRef: string | null;
  evidenceNote: string | null;
  note: string | null;
  settledBy: string;
  status: string;
}

export interface ManualSettlementResult {
  tenant: Tenant;
  manualSettlement: ManualSettlementSummary;
}
