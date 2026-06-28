import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../core/services/i18n.service';
import { OwnerTenantCreateFacade } from '../../state/owner-tenant-create.facade';
import { OwnerSearchableDropdownComponent } from '../../components/owner-searchable-dropdown/owner-searchable-dropdown.component';
import { OwnerDomainDropdownComponent } from '../../components/owner-domain-dropdown/owner-domain-dropdown.component';
import { OwnerPlanDropdownComponent } from '../../components/owner-plan-dropdown/owner-plan-dropdown.component';

@Component({
  selector: 'app-owner-tenant-create-page',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    OwnerSearchableDropdownComponent,
    OwnerDomainDropdownComponent,
    OwnerPlanDropdownComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-tenant-create-page.component.html',
  styleUrl: './owner-tenant-create-page.component.css',
})
export class OwnerTenantCreatePageComponent implements OnInit, OnDestroy {
  private readonly facade = inject(OwnerTenantCreateFacade);
  private readonly i18nService = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tenantForm = this.facade.tenantForm;

  readonly isSubmitting = this.facade.isSubmitting;
  readonly showTenantTypeDropdown = this.facade.showTenantTypeDropdown;
  readonly tenantTypeSearchQuery = this.facade.tenantTypeSearchQuery;
  readonly showPlanDropdown = this.facade.showPlanDropdown;
  readonly planSearchQuery = this.facade.planSearchQuery;
  readonly showDomainDropdown = this.facade.showDomainDropdown;
  readonly showCityDropdown = this.facade.showCityDropdown;
  readonly citySearchQuery = this.facade.citySearchQuery;
  readonly showCountryDropdown = this.facade.showCountryDropdown;
  readonly countrySearchQuery = this.facade.countrySearchQuery;
  readonly showCustomizationMenu = this.facade.showCustomizationMenu;
  readonly submitAttempted = this.facade.submitAttempted;
  readonly submitStatus = this.facade.submitStatus;
  readonly showSuccessModal = this.facade.showSuccessModal;

  readonly subscriptionTemplates = this.facade.subscriptionTemplates;
  readonly planLoadError = this.facade.planLoadError;
  readonly tenantTypes = this.facade.tenantTypes;
  readonly domains = this.facade.domains;
  readonly cities = this.facade.cities;
  readonly countries = this.facade.countries;
  readonly selectedPlanName = this.facade.selectedPlanName;
  readonly selectedCountryName = this.facade.selectedCountryName;
  readonly selectedCityName = this.facade.selectedCityName;
  readonly selectedCountryValue = this.facade.selectedCountryValue;
  readonly selectedCityValue = this.facade.selectedCityValue;
  readonly isRtl = this.i18nService.isRtl;

  t(key: string): string {
    return this.i18nService.t(key);
  }

  async ngOnInit(): Promise<void> {
    await this.facade.initialize();
    const contactName = (this.route.snapshot.queryParamMap.get('contactName') ?? '').trim();
    const contactEmail = (this.route.snapshot.queryParamMap.get('contactEmail') ?? '').trim();
    if (contactName || contactEmail) {
      this.tenantForm.patchValue({
        contactName: contactName || this.tenantForm.get('contactName')?.value || '',
        contactEmail: contactEmail || this.tenantForm.get('contactEmail')?.value || '',
      });
      this.tenantForm.get('contactName')?.markAsDirty();
      this.tenantForm.get('contactEmail')?.markAsDirty();
    }
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
    const source = (this.route.snapshot.queryParamMap.get('source') ?? '').trim();
    if (source === 'web-users') {
      const returnSearch = (this.route.snapshot.queryParamMap.get('returnSearch') ?? '').trim();
      void this.router.navigate(['/owner/web-users'], {
        queryParams: returnSearch ? { search: returnSearch } : {},
      });
      return;
    }
    this.facade.onCancel();
  }

  onReset(): void {
    this.facade.onReset();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  toggleTenantTypeDropdown(): void {
    this.facade.setTenantTypeDropdownOpen(!this.showTenantTypeDropdown());
  }

  closeTenantTypeDropdown(): void {
    this.facade.setTenantTypeDropdownOpen(false);
  }

  selectTenantType(type: string): void {
    this.facade.selectTenantType(type);
  }

  toggleDomainDropdown(): void {
    this.facade.setDomainDropdownOpen(!this.showDomainDropdown());
  }

  closeDomainDropdown(): void {
    this.facade.setDomainDropdownOpen(false);
  }

  selectDomain(domain: string): void {
    this.facade.selectDomain(domain);
  }

  toggleCityDropdown(): void {
    if (!this.tenantForm.get('countryId')?.value) {
      this.facade.setCityDropdownOpen(false);
      return;
    }
    this.facade.setCityDropdownOpen(!this.showCityDropdown());
  }

  closeCityDropdown(): void {
    this.facade.setCityDropdownOpen(false);
  }

  selectCity(city: string): void {
    this.facade.selectCity(city);
  }

  toggleCountryDropdown(): void {
    this.facade.setCountryDropdownOpen(!this.showCountryDropdown());
  }

  closeCountryDropdown(): void {
    this.facade.setCountryDropdownOpen(false);
  }

  selectCountry(country: string): void {
    this.facade.selectCountry(country);
  }

  togglePlanDropdown(): void {
    this.facade.setPlanDropdownOpen(!this.showPlanDropdown());
  }

  closePlanDropdown(): void {
    this.facade.setPlanDropdownOpen(false);
  }

  selectPlan(planId: string): void {
    this.facade.selectPlan(planId);
  }

  openCustomizationMenu(event: Event): void {
    this.facade.openCustomizationMenu(event);
  }

  closeCustomizationMenu(): void {
    this.facade.closeCustomizationMenu();
  }

  setTenantTypeSearchQuery(value: string): void {
    this.facade.setTenantTypeSearchQuery(value);
  }

  setCitySearchQuery(value: string): void {
    this.facade.setCitySearchQuery(value);
  }

  setCountrySearchQuery(value: string): void {
    this.facade.setCountrySearchQuery(value);
  }

  setPlanSearchQuery(value: string): void {
    this.facade.setPlanSearchQuery(value);
  }
}
