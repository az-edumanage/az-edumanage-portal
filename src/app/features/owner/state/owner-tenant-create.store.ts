import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerTenantCreateStore {
  readonly isSubmitting = signal(false);
  readonly showTenantTypeDropdown = signal(false);
  readonly tenantTypeSearchQuery = signal('');
  readonly showPlanDropdown = signal(false);
  readonly planSearchQuery = signal('');
  readonly showDomainDropdown = signal(false);
  readonly showCityDropdown = signal(false);
  readonly citySearchQuery = signal('');
  readonly showCountryDropdown = signal(false);
  readonly countrySearchQuery = signal('');
  readonly showCustomizationMenu = signal(false);

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setTenantTypeDropdownOpen(value: boolean): void {
    this.showTenantTypeDropdown.set(value);
  }

  setPlanDropdownOpen(value: boolean): void {
    this.showPlanDropdown.set(value);
  }

  setDomainDropdownOpen(value: boolean): void {
    this.showDomainDropdown.set(value);
  }

  setCityDropdownOpen(value: boolean): void {
    this.showCityDropdown.set(value);
  }

  setCountryDropdownOpen(value: boolean): void {
    this.showCountryDropdown.set(value);
  }

  setCustomizationMenuOpen(value: boolean): void {
    this.showCustomizationMenu.set(value);
  }
}
