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

export interface TenantLocationOption {
  id: number;
  value: string;
  label: string;
}

export interface TenantCreatePayload {
  centerName: string;
  tenantType: string;
  tenantUsername: string;
  subdomain: string;
  domain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  countryId: number;
  cityId: number;
  planId: string;
  isTrial: boolean;
  trialDays: number;
  region: string;
  autoProvision: boolean;
  sendInvite: boolean;
  onboardingLink: boolean;
  sendOnboardingWhatsapp: boolean;
  sendOnboardingEmail: boolean;
  temporaryPassword: string;
}
