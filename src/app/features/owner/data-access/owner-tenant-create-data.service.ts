import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import {
  ExistingTenant,
  TenantCreatePayload,
  TenantDuplicateField,
  TenantPlanOption,
} from '../models/owner-tenant-create.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly existingTenants = signal<ExistingTenant[]>([]);
  readonly subscriptionTemplates = signal<TenantPlanOption[]>([]);

  readonly tenantTypes = [
    'School',
    'Educational Center',
    'Individual Tutor',
    'Corporate Training',
    'University',
    'Bootcamp',
    'Online Academy',
  ];

  readonly industries = [
    'K-12 School',
    'Language Center',
    'Higher Education',
    'Vocational Training',
    'Other',
  ];

  readonly domains = ['.remix.com', '.academy.com', '.edu.com', '.school.com'];

  readonly cities = [
    'Cairo',
    'Alexandria',
    'Giza',
    'Dubai',
    'Abu Dhabi',
    'Riyadh',
    'Jeddah',
    'Amman',
    'Beirut',
  ];

  readonly countries = [
    'Egypt',
    'United Arab Emirates',
    'Saudi Arabia',
    'Jordan',
    'Lebanon',
    'Kuwait',
    'Qatar',
  ];

  async loadBootstrapData(): Promise<void> {
    await this.authApi.ensureLoggedIn();

    const [tenants, templates] = await Promise.all([
      firstValueFrom(this.http.get<Array<{
        centerName: string;
        subdomain: string;
        contactEmail: string | null;
        contactPhone: string | null;
      }>>(`${environment.apiBaseUrl}/tenant-catalog/tenants`)),
      firstValueFrom(this.http.get<Array<{
        id: string;
        name: string;
        monthlyPrice: number;
        currency: 'USD' | 'EUR' | 'EGP';
      }>>(`${environment.apiBaseUrl}/plan-catalog/plans`)),
    ]);

    this.existingTenants.set((tenants ?? []).map((tenant) => ({
      name: tenant.centerName ?? '',
      subdomain: tenant.subdomain ?? '',
      email: tenant.contactEmail ?? '',
      phone: tenant.contactPhone ?? '',
    })));

    this.subscriptionTemplates.set((templates ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      price: `${this.currencyPrefix(template.currency)}${template.monthlyPrice}/mo`,
      popular: false,
    })));
  }

  findExisting(field: TenantDuplicateField, value: string): ExistingTenant | null {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return (
      this.existingTenants().find(
        (tenant) => tenant[field].trim().toLowerCase() === normalized,
      ) ?? null
    );
  }

  createTenant(payload: TenantCreatePayload): Observable<void> {
    return from(this.saveTenant(payload));
  }

  private async saveTenant(payload: TenantCreatePayload): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/tenant-catalog/tenants`, payload));
  }

  private currencyPrefix(currency: 'USD' | 'EUR' | 'EGP'): string {
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    return 'LE ';
  }
}
