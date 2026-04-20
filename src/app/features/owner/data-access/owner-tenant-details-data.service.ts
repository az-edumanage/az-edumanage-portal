import { Injectable } from '@angular/core';
import { OwnerTenantDetails, OwnerTenantPlanOption } from '../models/owner-tenant-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantDetailsDataService {
  readonly plans: OwnerTenantPlanOption[] = [
    { id: 'starter', name: 'Starter', price: '$49/mo' },
    { id: 'pro', name: 'Professional', price: '$149/mo' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
  ];

  readonly tenant: OwnerTenantDetails = {
    id: 'tnt_001',
    centerName: 'Bright Future Academy',
    tenantType: 'Educational Center',
    subdomain: 'brightfuture',
    domain: '.remix.com',
    industry: 'K-12 School',
    contactName: 'John Doe',
    contactEmail: 'admin@brightfuture.edu',
    contactPhone: '+20 123 456 7890',
    address: '123 Education St',
    city: 'Cairo',
    country: 'Egypt',
    planId: 'enterprise',
    isTrial: true,
    trialDays: 14,
    region: 'me-south-1',
    autoProvision: true,
    sendInvite: true,
    onboardingLink: true,
    sendOnboardingWhatsapp: true,
    sendOnboardingEmail: false,
    status: 'Active',
    createdDate: 'Jan 15, 2024',
  };

  readonly modules = ['Attendance', 'Exams', 'Billing', 'LMS', 'Reports', 'Parent Portal'];

  getPlanPrice(planId: string): string {
    return this.plans.find((plan) => plan.id === planId)?.price ?? '';
  }

  getPlanName(planId: string | null): string {
    if (!planId) {
      return '';
    }

    return this.plans.find((plan) => plan.id === planId)?.name ?? '';
  }
}
