import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tenant, TenantStatus, TenantSubscriptionType, TenantCreatedBy } from '../models/owner-tenants.models';
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
  subscriptionType?: string | null;
  createdBy?: string | null;
  provisioningTriggeredBy?: string | null;
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
      tenantType: 'center',
      subscriptionType: 'trial',
      createdBy: 'system',
    };
    this.tenants.update((all) => [tenant, ...all]);
    return tenant;
  }

  private mapTenant(row: BackendTenantResponse): Tenant {
    const normalizedType = (row.tenantType || '').toLowerCase();
    const tenantType = normalizedType.includes('teacher') ? 'teacher' : 'center';
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
      subscriptionType: this.normalizeSubscriptionType(row.subscriptionType, row.isTrial),
      createdBy: this.normalizeCreatedBy(row.createdBy, row.provisioningTriggeredBy),
    };
  }

  private normalizeSubscriptionType(raw: string | null | undefined, isTrial: boolean): TenantSubscriptionType {
    const normalized = String(raw ?? '').trim().toLowerCase();
    if (normalized === 'production') {
      return 'production';
    }
    if (normalized === 'trial') {
      return 'trial';
    }
    return isTrial ? 'trial' : 'production';
  }

  private normalizeCreatedBy(
    createdByRaw: string | null | undefined,
    triggeredByRaw: string | null | undefined,
  ): TenantCreatedBy {
    const createdBy = String(createdByRaw ?? '').trim().toLowerCase();
    if (createdBy === 'admin' || createdBy === 'system') {
      return createdBy;
    }
    const triggeredBy = String(triggeredByRaw ?? '').trim().toLowerCase();
    return triggeredBy === 'admin' ? 'admin' : 'system';
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
