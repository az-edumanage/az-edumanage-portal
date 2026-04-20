import { Injectable, computed, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { OwnerTenantEditDataService } from '../data-access/owner-tenant-edit-data.service';
import { OwnerTenantEditPayload } from '../models/owner-tenant-edit.models';
import { OwnerTenantEditStore } from './owner-tenant-edit.store';

@Injectable({ providedIn: 'root' })
export class OwnerTenantEditFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(OwnerTenantEditStore);
  private readonly data = inject(OwnerTenantEditDataService);

  readonly tenantId = this.store.tenantId;
  readonly tenantName = this.store.tenantName;
  readonly isSubmitting = this.store.isSubmitting;
  readonly showTenantTypeDropdown = this.store.showTenantTypeDropdown;
  readonly showIndustryDropdown = this.store.showIndustryDropdown;
  readonly showPlanDropdown = this.store.showPlanDropdown;
  readonly showCityDropdown = this.store.showCityDropdown;
  readonly showCountryDropdown = this.store.showCountryDropdown;
  readonly showPassword = this.store.showPassword;

  readonly tenantTypes = this.data.tenantTypes;
  readonly industries = this.data.industries;
  readonly cities = this.data.cities;
  readonly countries = this.data.countries;
  readonly plans = this.data.plans;

  readonly tenantForm = this.fb.group(
    {
      centerName: ['', [Validators.required, Validators.minLength(3)]],
      tenantType: ['', Validators.required],
      subdomain: [{ value: '', disabled: true }],
      domain: ['.remix.com'],
      industry: ['', Validators.required],
      contactName: [''],
      contactEmail: ['', [Validators.email]],
      contactPhone: [''],
      address: [''],
      city: [''],
      country: [''],
      planId: ['', Validators.required],
      isTrial: [false],
      trialDays: [14],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: [''],
    },
    { validators: this.passwordMatchValidator },
  );

  readonly selectedPlanName = computed(() => {
    const planId = this.tenantForm.get('planId')?.value;
    const plan = this.plans.find((item) => item.id === planId);
    return plan?.name ?? '';
  });

  initialize(tenantId: string): void {
    this.store.setTenantId(tenantId);

    this.data.getTenantForEdit(tenantId).subscribe((payload) => {
      this.tenantForm.patchValue(payload);
      this.store.setTenantName(payload.centerName);
    });
  }

  onCancel(): void {
    this.router.navigate(['/owner/tenants', this.tenantId()]);
  }

  onSubmit(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.tenantForm.getRawValue() as OwnerTenantEditPayload;

    this.data
      .updateTenant(this.tenantId(), payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.router.navigate(['/owner/tenants', this.tenantId()]);
      });
  }

  selectTenantType(type: string): void {
    this.tenantForm.patchValue({ tenantType: type });
    this.showTenantTypeDropdown.set(false);
  }

  selectIndustry(industry: string): void {
    this.tenantForm.patchValue({ industry });
    this.showIndustryDropdown.set(false);
  }

  selectPlan(planId: string): void {
    this.tenantForm.patchValue({ planId });
    this.showPlanDropdown.set(false);
  }

  selectCity(city: string): void {
    this.tenantForm.patchValue({ city });
    this.showCityDropdown.set(false);
  }

  selectCountry(country: string): void {
    this.tenantForm.patchValue({ country });
    this.showCountryDropdown.set(false);
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  }
}
