import { Injectable, signal } from '@angular/core';
import { Tenant, TenantStatus } from '../models/owner-tenants.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsDataService {
  readonly tenants = signal<Tenant[]>([
    {
      id: 'tnt_001',
      name: 'Bright Future Academy',
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
}
