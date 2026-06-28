import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { CityLocationOption, CountryLocationOption, LocationSettingsService } from '../../../core/services/location-settings.service';
import {
  ExistingTenant,
  TenantCreatePayload,
  TenantDuplicateField,
  TenantLocationOption,
  TenantPlanOption,
} from '../models/owner-tenant-create.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly locationSettings = inject(LocationSettingsService);

  readonly existingTenants = signal<ExistingTenant[]>([]);
  readonly subscriptionTemplates = signal<TenantPlanOption[]>([]);
  readonly planLoadError = signal<string | null>(null);
  readonly countryOptions = signal<TenantLocationOption[]>([]);
  readonly cityOptions = signal<TenantLocationOption[]>([]);
  readonly countryDropdownOptions = computed(() => this.countryOptions().map((option) => ({ value: option.value, label: option.label })));
  readonly cityDropdownOptions = computed(() => this.cityOptions().map((option) => ({ value: option.value, label: option.label })));

  readonly tenantTypes = [
    'Center',
    'Teacher'
  ];

  readonly domains = ['.az-edumanage.com'];

  async loadBootstrapData(): Promise<void> {
    await this.authApi.ensureLoggedIn();

    const [tenants, templates, countries] = await Promise.all([
      firstValueFrom(this.http.get<{
        centerName: string;
        subdomain: string;
        contactEmail: string | null;
        contactPhone: string | null;
      }[]>(`${environment.apiBaseUrl}/tenant-catalog/tenants`)),
      this.loadPlanOptions(),
      this.locationSettings.listCountries(true),
    ]);

    this.existingTenants.set((tenants ?? []).map((tenant) => ({
      name: tenant.centerName ?? '',
      subdomain: tenant.subdomain ?? '',
      email: tenant.contactEmail ?? '',
      phone: tenant.contactPhone ?? '',
    })));

    this.subscriptionTemplates.set(templates);
    this.countryOptions.set((countries ?? []).map((country) => this.toCountryOption(country)));
    this.cityOptions.set([]);
  }

  async loadCities(countryId: number): Promise<void> {
    const cities = await this.locationSettings.listCities(countryId, true);
    this.cityOptions.set((cities ?? []).map((city) => this.toCityOption(city)));
  }

  clearCities(): void {
    this.cityOptions.set([]);
  }

  findCountryByValue(value: string): TenantLocationOption | null {
    return this.findOptionByValue(this.countryOptions(), value);
  }

  findCityByValue(value: string): TenantLocationOption | null {
    return this.findOptionByValue(this.cityOptions(), value);
  }

  findCountryById(countryId: number | null | undefined): TenantLocationOption | null {
    return this.findOptionById(this.countryOptions(), countryId);
  }

  findCityById(cityId: number | null | undefined): TenantLocationOption | null {
    return this.findOptionById(this.cityOptions(), cityId);
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

  private async loadPlanOptions(): Promise<TenantPlanOption[]> {
    this.planLoadError.set(null);
    try {
      const plans = await firstValueFrom(this.http.get<{
        id: string;
        name: string;
        status?: string;
        visibility?: string;
        monthlyPrice: number;
        currency: 'USD' | 'EUR' | 'EGP';
        isRecommended?: boolean;
      }[]>(`${environment.apiBaseUrl}/plan-catalog/plans`));
      const selectablePlans = (plans ?? []).filter((plan) => this.isSelectablePlan(plan));
      if (selectablePlans.length === 0) {
        this.planLoadError.set('No active subscription plans are available.');
      }
      return selectablePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: `${this.currencyPrefix(plan.currency)}${plan.monthlyPrice}/mo`,
        popular: Boolean(plan.isRecommended),
      }));
    } catch {
      this.planLoadError.set('Subscription plans could not be loaded.');
      return [];
    }
  }

  private isSelectablePlan(plan: { status?: string; visibility?: string }): boolean {
    const status = plan.status?.toUpperCase();
    const visibility = plan.visibility?.toUpperCase();
    return (!status || status === 'ACTIVE') && (!visibility || visibility === 'PUBLIC');
  }

  private findOptionByValue(options: TenantLocationOption[], value: string): TenantLocationOption | null {
    return options.find((option) => option.value === value) ?? null;
  }

  private findOptionById(options: TenantLocationOption[], id: number | null | undefined): TenantLocationOption | null {
    if (id == null) {
      return null;
    }
    return options.find((option) => option.id === id) ?? null;
  }

  private toCountryOption(country: CountryLocationOption): TenantLocationOption {
    return { id: country.id, value: String(country.id), label: country.nameEn };
  }

  private toCityOption(city: CityLocationOption): TenantLocationOption {
    return { id: city.id, value: String(city.id), label: city.nameEn };
  }

  private currencyPrefix(currency: 'USD' | 'EUR' | 'EGP'): string {
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    return 'LE ';
  }
}
