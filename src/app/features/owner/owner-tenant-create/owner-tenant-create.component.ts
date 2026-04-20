import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerTenantCreateFacade } from '../state/owner-tenant-create.facade';

@Component({
  selector: 'app-owner-tenant-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-tenant-create.component.html',
  styleUrl: './owner-tenant-create.component.css'})
export class OwnerTenantCreateComponent implements OnInit, OnDestroy {
  private readonly facade = inject(OwnerTenantCreateFacade);

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

  readonly filteredTenantTypes = this.facade.filteredTenantTypes;
  readonly filteredIndustries = this.facade.filteredIndustries;
  readonly filteredPlans = this.facade.filteredPlans;
  readonly filteredCities = this.facade.filteredCities;
  readonly filteredCountries = this.facade.filteredCountries;

  readonly tenantForm = this.facade.tenantForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  getSelectedPlanName(): string {
    return this.facade.selectedPlanName();
  }

  selectTenantType(type: string): void {
    this.facade.selectTenantType(type);
  }

  openCustomizationMenu(event: Event): void {
    this.facade.openCustomizationMenu(event);
  }

  closeCustomizationMenu(): void {
    this.facade.closeCustomizationMenu();
  }

  selectIndustry(industry: string): void {
    this.facade.selectIndustry(industry);
  }

  selectPlan(planId: string): void {
    this.facade.selectPlan(planId);
  }

  selectDomain(domain: string): void {
    this.facade.selectDomain(domain);
  }

  selectCity(city: string): void {
    this.facade.selectCity(city);
  }

  selectCountry(country: string): void {
    this.facade.selectCountry(country);
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
}
