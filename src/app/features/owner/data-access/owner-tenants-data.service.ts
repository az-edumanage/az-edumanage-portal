import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tenant, TenantStatus } from '../models/owner-tenants.models';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

interface BackendTenantResponse {
  id: string;
  centerName: string;
  tenantType: string;
  subdomain: string;
  domain: string;
  industry: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  planName: string;
  isTrial: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerTenantsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly tenants = signal<Tenant[]>([]);

  async loadFromBackend(): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const rows = await firstValueFrom(
      this.http.get<BackendTenantResponse[]>(`${environment.apiBaseUrl}/tenant-catalog/tenants`),
    );

    const mapped = (rows ?? []).map((row) => this.mapTenant(row));
    this.tenants.set(mapped);
  }

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
      id: `temp_${Date.now()}`,
      name: payload.name.trim(),
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      status: 'Active',
      plan: payload.plan?.trim() || 'Trial Plan',
      createdDate: this.toDateLabel(new Date().toISOString()),
      ownerEmail: payload.ownerEmail.trim().toLowerCase(),
      healthStatus: 'Healthy',
      tenantType: 'Educational Center',
    };
    this.tenants.update((all) => [tenant, ...all]);
    return tenant;
  }

  private mapTenant(row: BackendTenantResponse): Tenant {
    const normalizedType = (row.tenantType || '').toLowerCase();
    const tenantType = normalizedType.includes('teacher') ? 'Individual Teacher' : 'Educational Center';
    return {
      id: row.id,
      name: row.centerName || 'N/A',
      fullName: row.contactName?.trim() || 'N/A',
      phoneNumber: row.contactPhone?.trim() || 'N/A',
      status: 'Active',
      plan: row.planName || 'N/A',
      createdDate: this.toDateLabel(row.createdAt),
      ownerEmail: row.contactEmail?.trim() || 'N/A',
      healthStatus: 'Healthy',
      tenantType,
    };
  }

  private toDateLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
