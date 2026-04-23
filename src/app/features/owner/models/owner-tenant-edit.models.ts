export interface OwnerTenantEditPlanOption {
  id: string;
  name: string;
  price: string;
}

export interface OwnerTenantEditPayload {
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
  isTrial: boolean;
  trialDays: number;
  newPassword: string;
  confirmPassword: string;
}
