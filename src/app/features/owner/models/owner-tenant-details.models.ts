export interface OwnerTenantPlanOption {
  id: string;
  name: string;
  price: string;
}

export interface OwnerTenantOpenInvoiceApiResponse {
  id: string;
  invoiceRef: string | null;
  amount: number | null;
  currency: string | null;
  periodStartAt: string | null;
  periodEndAt: string | null;
  dueDate: string | null;
  status: string | null;
}

export interface OwnerTenantOpenInvoiceSummary {
  id: string;
  invoiceRef: string;
  amount: string;
  currency: string;
  periodStartAt: string;
  periodEndAt: string;
  dueDate: string;
  status: string;
}

export interface TenantBillingHistoryRow {
  id: string;
  invoice: string;
  date: string;
  amount: string;
  status: string;
  downloadUrl?: string | null;
}

export interface OwnerTenantDetailsApiResponse {
  id: string;
  centerName: string | null;
  tenantType: string | null;
  subdomain: string | null;
  domain: string | null;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  planId: string | null;
  planName: string | null;
  isTrial: boolean | null;
  trialDays: number | null;
  region: string | null;
  autoProvision: boolean | null;
  sendInvite: boolean | null;
  onboardingLink: boolean | null;
  sendOnboardingWhatsapp: boolean | null;
  sendOnboardingEmail: boolean | null;
  schemaName: string | null;
  provisioningStatus: string | null;
  provisioningError: string | null;
  isActive: boolean | null;
  tenantOperationalStatus: string | null;
  ownerDisplayStatus: string | null;
  subscriptionState: string | null;
  subscriptionType: string | null;
  subscriptionStartedAt: string | null;
  currentPeriodStartAt: string | null;
  currentPeriodEndAt: string | null;
  nextBillingDate: string | null;
  billingStatus: string | null;
  openInvoice: OwnerTenantOpenInvoiceApiResponse | null;
  providerPaymentStatus: string | null;
  settlementStatus: string | null;
  createdBy: string | null;
  provisioningSource: string | null;
  provisioningTriggeredBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OwnerTenantDetails {
  id: string;
  centerName: string;
  tenantType: string;
  subdomain: string;
  domain: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  planId: string;
  planName: string;
  isTrial: boolean;
  trialDays: number;
  region: string;
  autoProvision: boolean;
  sendInvite: boolean;
  onboardingLink: boolean;
  sendOnboardingWhatsapp: boolean;
  sendOnboardingEmail: boolean;
  schemaName: string;
  provisioningStatus: string;
  provisioningError: string;
  isActive: boolean;
  tenantOperationalStatus: string;
  ownerDisplayStatus: string;
  subscriptionState: string;
  subscriptionType: string;
  subscriptionStartedAt: string;
  currentPeriodStartAt: string;
  currentPeriodEndAt: string;
  billingStatus: string;
  openInvoice: OwnerTenantOpenInvoiceSummary | null;
  providerPaymentStatus: string;
  settlementStatus: string;
  createdBy: string;
  provisioningSource: string;
  provisioningTriggeredBy: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  addressDisplay: string;
  tenantUrl: string;
  nextBillingDate: string;
  usageStudents: string;
  usageStudentsLimit: string;
  usageStorage: string;
  usageStorageLimit: string;
  usageApiCalls: string;
  usageApiCallsLimit: string;
}
