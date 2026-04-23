import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import {
  ExistingTenant,
  TenantCreatePayload,
  TenantDuplicateField,
  TenantPlanOption,
} from '../models/owner-tenant-create.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantCreateDataService {
  readonly existingTenants: ExistingTenant[] = [
    {
      name: 'Cairo Excellence Academy',
      subdomain: 'cairo-excellence',
      email: 'contact@cairo-excellence.com',
      phone: '+201000000001',
    },
    {
      name: 'Alexandria Language School',
      subdomain: 'alex-lang',
      email: 'info@alex-lang.com',
      phone: '+201000000002',
    },
  ];

  readonly plans: TenantPlanOption[] = [
    { id: 'starter', name: 'Starter', price: '$49/mo', popular: false },
    { id: 'pro', name: 'Professional', price: '$149/mo', popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', popular: false },
  ];

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

  findExisting(field: TenantDuplicateField, value: string): ExistingTenant | null {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return (
      this.existingTenants.find(
        (tenant) => tenant[field].trim().toLowerCase() === normalized,
      ) ?? null
    );
  }

  createTenant(payload: TenantCreatePayload): Observable<void> {
    void payload;
    return timer(2000).pipe(map(() => void 0));
  }
}
