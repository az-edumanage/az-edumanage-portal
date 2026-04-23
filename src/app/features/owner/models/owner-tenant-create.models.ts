export type TenantDuplicateField = 'name' | 'subdomain' | 'email' | 'phone';

export interface ExistingTenant {
  name: string;
  subdomain: string;
  email: string;
  phone: string;
}

export interface TenantPlanOption {
  id: string;
  name: string;
  price: string;
  popular: boolean;
}

export interface TenantCreatePayload {
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
}
