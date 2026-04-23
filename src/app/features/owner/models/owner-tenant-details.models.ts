export interface OwnerTenantPlanOption {
  id: string;
  name: string;
  price: string;
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
  isTrial: boolean;
  trialDays: number;
  region: string;
  autoProvision: boolean;
  sendInvite: boolean;
  onboardingLink: boolean;
  sendOnboardingWhatsapp: boolean;
  sendOnboardingEmail: boolean;
  status: string;
  createdDate: string;
}
