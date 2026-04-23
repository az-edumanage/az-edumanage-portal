import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { OwnerApiService } from './owner-api.service';
import { OwnerTenantEditPayload, OwnerTenantEditPlanOption } from '../models/owner-tenant-edit.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantEditDataService {
  private readonly ownerApi = inject(OwnerApiService);

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

  readonly plans: OwnerTenantEditPlanOption[] = [
    { id: 'starter', name: 'Starter', price: '$49/mo' },
    { id: 'pro', name: 'Professional', price: '$149/mo' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
  ];

  getTenantForEdit(tenantId: string): Observable<OwnerTenantEditPayload> {
    return this.ownerApi.fetchTenantForEdit(tenantId).pipe(
      map((payload) => ({
        ...payload,
        newPassword: '',
        confirmPassword: '',
      })),
    );
  }

  updateTenant(tenantId: string, payload: OwnerTenantEditPayload): Observable<void> {
    return this.ownerApi
      .updateTenant(tenantId, payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
