export type ProviderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'unknown';
export type SubscriptionState = 'trial' | 'pending_payment' | 'production' | 'expired' | 'cancelled' | 'unknown';
export type TenantSubscriptionType = 'trial' | 'production';
export type TenantOperationalStatus = 'active' | 'suspended' | 'disabled' | 'blocked' | 'pending' | 'unknown';
export type SettlementStatus = 'provider_paid' | 'manual_paid' | 'unpaid' | 'failed' | 'unknown';
export type OwnerDisplayStatus = 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked' | 'unknown';
export type ManualTenantLifecycleTargetStatus = 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked';
export type TenantStatus = string;
export type TenantHealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type TenantType = 'center' | 'teacher';
export type TenantCreatedBy = 'system' | 'admin';

export const TENANT_STATUS_OPTIONS: TenantStatus[] = [
  'Pending',
  'Active',
  'Suspended',
  'Disabled',
  'Blocked',
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
  subscriptionState: SubscriptionState;
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

export interface ManualTenantLifecycleStatusChangeRequest {
  targetStatus: ManualTenantLifecycleTargetStatus;
  reason: string;
}

export interface TenantLifecycleBillingSideEffectSummary {
  happened: boolean;
  type: 'none' | 'invoice_created_and_manually_settled' | 'existing_invoice_manually_settled';
  invoiceId: string | null;
  invoiceRef: string | null;
  manualSettlementId: string | null;
  manualSettlementRef: string | null;
  paymentTransactionId: string | null;
}

export interface TenantLifecycleAuditSummary {
  id: string;
  source: 'OWNER_MANUAL';
  outcome: 'success' | 'rejected' | 'failed';
  previousStatus: ManualTenantLifecycleTargetStatus;
  requestedTargetStatus: ManualTenantLifecycleTargetStatus;
  finalStatus: ManualTenantLifecycleTargetStatus | null;
  actorUsername: string | null;
  reason: string;
  billingSideEffect: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface TenantLifecycleStatusChangeResult {
  tenant: Tenant;
  billingSideEffect: TenantLifecycleBillingSideEffectSummary;
  audit: TenantLifecycleAuditSummary;
}

export function toManualTenantLifecycleTargetStatus(
  status: TenantStatus,
): ManualTenantLifecycleTargetStatus | null {
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'pending';
    case 'active':
      return 'active';
    case 'suspended':
      return 'suspended';
    case 'disabled':
      return 'disabled';
    case 'blocked':
      return 'blocked';
    default:
      return null;
  }
}
