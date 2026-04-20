import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerTenantEditFacade } from '../state/owner-tenant-edit.facade';

@Component({
  selector: 'app-owner-tenant-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-tenant-edit.component.html',
  styleUrl: './owner-tenant-edit.component.css'})
export class OwnerTenantEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OwnerTenantEditFacade);

  readonly tenantForm = this.facade.tenantForm;
  readonly tenantName = this.facade.tenantName;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly showTenantTypeDropdown = this.facade.showTenantTypeDropdown;
  readonly showIndustryDropdown = this.facade.showIndustryDropdown;
  readonly showPlanDropdown = this.facade.showPlanDropdown;
  readonly showCityDropdown = this.facade.showCityDropdown;
  readonly showCountryDropdown = this.facade.showCountryDropdown;
  readonly showPassword = this.facade.showPassword;

  readonly tenantTypes = this.facade.tenantTypes;
  readonly industries = this.facade.industries;
  readonly cities = this.facade.cities;
  readonly countries = this.facade.countries;
  readonly plans = this.facade.plans;

  get tenantId(): string {
    return this.facade.tenantId();
  }

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.params['id']);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  selectTenantType(type: string): void {
    this.facade.selectTenantType(type);
  }

  selectIndustry(industry: string): void {
    this.facade.selectIndustry(industry);
  }

  selectPlan(planId: string): void {
    this.facade.selectPlan(planId);
  }

  selectCity(city: string): void {
    this.facade.selectCity(city);
  }

  selectCountry(country: string): void {
    this.facade.selectCountry(country);
  }

  getSelectedPlanName(): string {
    return this.facade.selectedPlanName();
  }
}
