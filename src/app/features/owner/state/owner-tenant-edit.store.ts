import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerTenantEditStore {
  readonly tenantId = signal('');
  readonly tenantName = signal('Loading...');
  readonly isSubmitting = signal(false);
  readonly showTenantTypeDropdown = signal(false);
  readonly showIndustryDropdown = signal(false);
  readonly showPlanDropdown = signal(false);
  readonly showCityDropdown = signal(false);
  readonly showCountryDropdown = signal(false);
  readonly showPassword = signal(false);

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setTenantId(value: string): void {
    this.tenantId.set(value);
  }

  setTenantName(value: string): void {
    this.tenantName.set(value);
  }
}
