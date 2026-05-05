import { Injectable, signal } from '@angular/core';
import { Tenant, TenantStatus } from '../models/owner-tenants.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsDataService {
  readonly tenants = signal<Tenant[]>([
    {
      id: 'tnt_001',
      name: 'Bright Future Academy',
      fullName: 'Mohamed Hassan',
      phoneNumber: '+20 100 123 4567',
      status: 'Active',
      plan: 'Enterprise',
      createdDate: 'Jan 15, 2024',
      ownerEmail: 'admin@brightfuture.edu',
      healthStatus: 'Healthy',
      tenantType: 'Educational Center',
    },
    {
      id: 'tnt_002',
      name: 'Cairo Math Center',
      fullName: 'Nour El Din',
      phoneNumber: '+20 111 223 3445',
      status: 'Trial',
      plan: 'Professional',
      createdDate: 'Feb 02, 2024',
      ownerEmail: 'contact@cairomath.com',
      healthStatus: 'Healthy',
      tenantType: 'Educational Center',
    },
    {
      id: 'tnt_003',
      name: 'Elite Tutors',
      fullName: 'Sarah Mostafa',
      phoneNumber: '+20 122 345 6789',
      status: 'Active',
      plan: 'Starter',
      createdDate: 'Dec 10, 2023',
      ownerEmail: 'sarah@elitetutors.net',
      healthStatus: 'Degraded',
      tenantType: 'Individual Teacher',
    },
    {
      id: 'tnt_004',
      name: 'Physics Pro',
      fullName: 'Ahmed Nabil',
      phoneNumber: '+20 127 222 1100',
      status: 'Active',
      plan: 'Professional',
      createdDate: 'Jan 20, 2024',
      ownerEmail: 'dr.ahmed@physicspro.com',
      healthStatus: 'Healthy',
      tenantType: 'Educational Center',
    },
    {
      id: 'tnt_005',
      name: 'Language Hub',
      fullName: 'Mona Khaled',
      phoneNumber: '+20 109 900 4455',
      status: 'Suspended',
      plan: 'Starter',
      createdDate: 'Nov 05, 2023',
      ownerEmail: 'info@langhub.org',
      healthStatus: 'Down',
      tenantType: 'Educational Center',
    },
  ]);

  updateTenantStatus(tenantId: string, status: TenantStatus): void {
    this.tenants.update((all) =>
      all.map((tenant) => (tenant.id === tenantId ? { ...tenant, status } : tenant)),
    );
  }

  updateTenantPlan(tenantId: string, plan: string): void {
    this.tenants.update((all) =>
      all.map((tenant) => (tenant.id === tenantId ? { ...tenant, plan } : tenant)),
    );
  }

  addTrialTenant(payload: {
    name: string;
    fullName: string;
    phoneNumber: string;
    ownerEmail: string;
    plan?: string;
  }): Tenant {
    const tenant: Tenant = {
      id: `tnt_${Date.now()}`,
      name: payload.name.trim(),
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      status: 'Trial',
      plan: payload.plan?.trim() || 'Trial Plan',
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ownerEmail: payload.ownerEmail.trim().toLowerCase(),
      healthStatus: 'Healthy',
      tenantType: 'Educational Center',
    };

    this.tenants.update((all) => [tenant, ...all]);
    return tenant;
  }
}
