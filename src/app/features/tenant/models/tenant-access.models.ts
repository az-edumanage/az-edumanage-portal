export type TenantOperationalStatus = 'active' | 'pending' | 'suspended' | 'disabled' | 'blocked' | 'unknown';

export interface TenantAccessContextView {
  tenantId: string;
  subscriptionState: string;
  tenantOperationalStatus: TenantOperationalStatus;
  ownerDisplayStatus: string;
  accessMessage: string | null;
  operationalStatusReason: string | null;
}
