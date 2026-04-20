import { Injectable, computed, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { OwnerTenantCreateDataService } from '../data-access/owner-tenant-create-data.service';
import {
  TenantCreatePayload,
  TenantDuplicateField,
} from '../models/owner-tenant-create.models';
import { OwnerTenantCreateStore } from './owner-tenant-create.store';

@Injectable({ providedIn: 'root' })
export class OwnerTenantCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly store = inject(OwnerTenantCreateStore);
  private readonly data = inject(OwnerTenantCreateDataService);

  private isSuccess = false;
  private readonly taskId = 'create-tenant-task';

  readonly isSubmitting = this.store.isSubmitting;
  readonly showTenantTypeDropdown = this.store.showTenantTypeDropdown;
  readonly tenantTypeSearchQuery = this.store.tenantTypeSearchQuery;
  readonly showIndustryDropdown = this.store.showIndustryDropdown;
  readonly industrySearchQuery = this.store.industrySearchQuery;
  readonly showPlanDropdown = this.store.showPlanDropdown;
  readonly planSearchQuery = this.store.planSearchQuery;
  readonly showDomainDropdown = this.store.showDomainDropdown;
  readonly showCityDropdown = this.store.showCityDropdown;
  readonly citySearchQuery = this.store.citySearchQuery;
  readonly showCountryDropdown = this.store.showCountryDropdown;
  readonly countrySearchQuery = this.store.countrySearchQuery;
  readonly showCustomizationMenu = this.store.showCustomizationMenu;

  readonly plans = this.data.plans;
  readonly tenantTypes = this.data.tenantTypes;
  readonly industries = this.data.industries;
  readonly domains = this.data.domains;
  readonly cities = this.data.cities;
  readonly countries = this.data.countries;

  readonly selectedPlanName = computed(() => {
    const planId = this.tenantForm.get('planId')?.value;
    const plan = this.plans.find((item) => item.id === planId);
    return plan?.name ?? '';
  });

  readonly tenantForm = this.fb.group({
    centerName: [
      '',
      [Validators.required, Validators.minLength(3), this.checkExisting('name')],
    ],
    tenantType: ['', Validators.required],
    subdomain: [
      '',
      [
        Validators.required,
        Validators.pattern('^[a-z0-9-]+$'),
        this.checkExisting('subdomain'),
      ],
    ],
    domain: ['.remix.com', Validators.required],
    industry: ['', Validators.required],
    contactName: [''],
    contactEmail: ['', [Validators.email, this.checkExisting('email')]],
    contactPhone: ['', [this.checkExisting('phone')]],
    address: [''],
    city: [''],
    country: [''],
    planId: ['', Validators.required],
    isTrial: [true],
    trialDays: [
      14,
      [Validators.required, Validators.min(1), Validators.pattern('^[0-9]*$')],
    ],
    region: ['me-south-1'],
    autoProvision: [true],
    sendInvite: [true],
    onboardingLink: [false],
    sendOnboardingWhatsapp: [false],
    sendOnboardingEmail: [false],
  });

  initialize(): void {
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      const value = savedTask.data as Partial<TenantCreatePayload>;
      this.tenantForm.patchValue(value);
      this.taskService.removeTask(this.taskId);
    }
  }

  onDestroy(): void {
    const value = this.tenantForm.getRawValue();
    const hasData = value.centerName !== '' || value.subdomain !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Provisioning: ${value.centerName || 'New Tenant'}`,
        route: '/owner/tenants/create',
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/tenants']);
  }

  onReset(): void {
    this.tenantForm.reset({
      domain: '.remix.com',
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false,
    });

    this.tenantTypeSearchQuery.set('');
    this.industrySearchQuery.set('');
    this.planSearchQuery.set('');
    this.citySearchQuery.set('');
    this.countrySearchQuery.set('');
    this.closeAllDropdowns();
  }

  onSubmit(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.tenantForm.getRawValue() as TenantCreatePayload;

    this.data
      .createTenant(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.router.navigate(['/owner/tenants']);
      });
  }

  setTenantTypeDropdownOpen(value: boolean): void {
    this.store.setTenantTypeDropdownOpen(value);
  }

  setTenantTypeSearchQuery(value: string): void {
    this.tenantTypeSearchQuery.set(value);
  }

  selectTenantType(type: string): void {
    this.tenantForm.patchValue({ tenantType: type });
    this.store.setTenantTypeDropdownOpen(false);
    this.tenantTypeSearchQuery.set('');
  }

  setDomainDropdownOpen(value: boolean): void {
    this.store.setDomainDropdownOpen(value);
  }

  selectDomain(domain: string): void {
    this.tenantForm.patchValue({ domain });
    this.store.setDomainDropdownOpen(false);
  }

  setIndustryDropdownOpen(value: boolean): void {
    this.store.setIndustryDropdownOpen(value);
  }

  setIndustrySearchQuery(value: string): void {
    this.industrySearchQuery.set(value);
  }

  selectIndustry(industry: string): void {
    this.tenantForm.patchValue({ industry });
    this.store.setIndustryDropdownOpen(false);
    this.industrySearchQuery.set('');
  }

  setCityDropdownOpen(value: boolean): void {
    this.store.setCityDropdownOpen(value);
  }

  setCitySearchQuery(value: string): void {
    this.citySearchQuery.set(value);
  }

  selectCity(city: string): void {
    this.tenantForm.patchValue({ city });
    this.store.setCityDropdownOpen(false);
    this.citySearchQuery.set('');
  }

  setCountryDropdownOpen(value: boolean): void {
    this.store.setCountryDropdownOpen(value);
  }

  setCountrySearchQuery(value: string): void {
    this.countrySearchQuery.set(value);
  }

  selectCountry(country: string): void {
    this.tenantForm.patchValue({ country });
    this.store.setCountryDropdownOpen(false);
    this.countrySearchQuery.set('');
  }

  setPlanDropdownOpen(value: boolean): void {
    this.store.setPlanDropdownOpen(value);
  }

  setPlanSearchQuery(value: string): void {
    this.planSearchQuery.set(value);
  }

  selectPlan(planId: string): void {
    this.tenantForm.patchValue({ planId });
    this.store.setPlanDropdownOpen(false);
    this.planSearchQuery.set('');
  }

  openCustomizationMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.setCustomizationMenuOpen(true);
  }

  closeCustomizationMenu(): void {
    this.store.setCustomizationMenuOpen(false);
  }

  private closeAllDropdowns(): void {
    this.store.setTenantTypeDropdownOpen(false);
    this.store.setIndustryDropdownOpen(false);
    this.store.setPlanDropdownOpen(false);
    this.store.setDomainDropdownOpen(false);
    this.store.setCityDropdownOpen(false);
    this.store.setCountryDropdownOpen(false);
  }

  private checkExisting(field: TenantDuplicateField): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const existing = this.data.findExisting(field, control.value);
      if (!existing) {
        return null;
      }

      return { alreadyExists: { source: existing.name } };
    };
  }
}
