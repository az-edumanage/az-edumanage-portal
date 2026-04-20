import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
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

  readonly tenantForm = this.facade.tenantForm;

  readonly isSubmitting = this.facade.isSubmitting;
  readonly showTenantTypeDropdown = this.facade.showTenantTypeDropdown;
  readonly tenantTypeSearchQuery = this.facade.tenantTypeSearchQuery;
  readonly showIndustryDropdown = this.facade.showIndustryDropdown;
  readonly industrySearchQuery = this.facade.industrySearchQuery;
  readonly showPlanDropdown = this.facade.showPlanDropdown;
  readonly planSearchQuery = this.facade.planSearchQuery;
  readonly showDomainDropdown = this.facade.showDomainDropdown;
  readonly showCityDropdown = this.facade.showCityDropdown;
  readonly citySearchQuery = this.facade.citySearchQuery;
  readonly showCountryDropdown = this.facade.showCountryDropdown;
  readonly countrySearchQuery = this.facade.countrySearchQuery;
  readonly showCustomizationMenu = this.facade.showCustomizationMenu;

  readonly plans = this.facade.plans;
  readonly tenantTypes = this.facade.tenantTypes;
  readonly industries = this.facade.industries;
  readonly domains = this.facade.domains;
  readonly cities = this.facade.cities;
  readonly countries = this.facade.countries;
  readonly selectedPlanName = this.facade.selectedPlanName;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
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

  toggleIndustryDropdown(): void {
    this.facade.setIndustryDropdownOpen(!this.showIndustryDropdown());
  }

  closeIndustryDropdown(): void {
    this.facade.setIndustryDropdownOpen(false);
  }

  selectIndustry(industry: string): void {
    this.facade.selectIndustry(industry);
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

  setIndustrySearchQuery(value: string): void {
    this.facade.setIndustrySearchQuery(value);
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
