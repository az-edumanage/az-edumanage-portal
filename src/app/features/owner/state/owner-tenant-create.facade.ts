import { Injectable, computed, inject, signal } from '@angular/core';
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
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly taskId = 'create-tenant-task';
  private readonly successRedirectDelayMs = 1600;

  readonly isSubmitting = this.store.isSubmitting;
  readonly showTenantTypeDropdown = this.store.showTenantTypeDropdown;
  readonly tenantTypeSearchQuery = this.store.tenantTypeSearchQuery;
  readonly showPlanDropdown = this.store.showPlanDropdown;
  readonly planSearchQuery = this.store.planSearchQuery;
  readonly showDomainDropdown = this.store.showDomainDropdown;
  readonly showCityDropdown = this.store.showCityDropdown;
  readonly citySearchQuery = this.store.citySearchQuery;
  readonly showCountryDropdown = this.store.showCountryDropdown;
  readonly countrySearchQuery = this.store.countrySearchQuery;
  readonly showCustomizationMenu = this.store.showCustomizationMenu;
  readonly submitAttempted = signal(false);
  readonly submitStatus = signal<{ success: boolean; message: string } | null>(null);
  readonly showSuccessModal = signal(false);

  readonly subscriptionTemplates = this.data.subscriptionTemplates;
  readonly planLoadError = this.data.planLoadError;
  readonly tenantTypes = this.data.tenantTypes;
  readonly domains = this.data.domains;
  readonly cities = this.data.cityDropdownOptions;
  readonly countries = this.data.countryDropdownOptions;
  readonly selectedCountryValue = signal('');
  readonly selectedCityValue = signal('');

  readonly filteredTenantTypes = computed(() => {
    const query = this.tenantTypeSearchQuery().toLowerCase();
    return this.tenantTypes.filter((type) => type.toLowerCase().includes(query));
  });


  readonly filteredPlans = computed(() => {
    const query = this.planSearchQuery().toLowerCase();
    return this.subscriptionTemplates().filter((template) => template.name.toLowerCase().includes(query));
  });

  readonly filteredCities = computed(() => {
    const query = this.citySearchQuery().toLowerCase();
    return this.cities().filter((city) => city.label.toLowerCase().includes(query));
  });

  readonly filteredCountries = computed(() => {
    const query = this.countrySearchQuery().toLowerCase();
    return this.countries().filter((country) => country.label.toLowerCase().includes(query));
  });

  readonly selectedPlanName = computed(() => {
    const planId = this.tenantForm.get('planId')?.value;
    const template = this.subscriptionTemplates().find((item) => item.id === planId);
    return template?.name ?? '';
  });

  readonly selectedCountryName = computed(() =>
    this.data.findCountryById(this.tenantForm.get('countryId')?.value)?.label ?? '',
  );

  readonly selectedCityName = computed(() =>
    this.data.findCityById(this.tenantForm.get('cityId')?.value)?.label ?? '',
  );

  readonly tenantForm = this.fb.group({
    centerName: [
      "",
      [Validators.required, Validators.minLength(3), this.checkExisting("name")],
    ],
    tenantType: ["", Validators.required],
    tenantUsername: ["", [Validators.required, Validators.minLength(3), Validators.pattern("^[A-Za-z0-9._-]+$")]],
    temporaryPassword: ["", [Validators.required, Validators.minLength(8)]],
    subdomain: [
      "",
      [
        Validators.required,
        Validators.pattern("^[a-z0-9-]+$"),
        this.checkExisting("subdomain"),
      ],
    ],
    domain: [".az-edumanage.com", Validators.required],
    contactName: [""],
    contactEmail: ["", [Validators.email, this.checkExisting("email")]],
    contactPhone: ["", [this.checkExisting("phone")]],
    address: [""],
    countryId: [null as number | null, Validators.required],
    cityId: [null as number | null, Validators.required],
    planId: ["", Validators.required],
    isTrial: [true],
    trialDays: [
      14,
      [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")],
    ],
    region: ["me-south-1"],
    autoProvision: [true],
    sendInvite: [true],
    onboardingLink: [false],
    sendOnboardingWhatsapp: [false],
    sendOnboardingEmail: [false],
  });

  async initialize(): Promise<void> {
    try {
      await this.data.loadBootstrapData();
    } catch {
      this.submitStatus.set({ success: false, message: "Tenant create data could not be loaded." });
    }
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      const safeValue: Partial<TenantCreatePayload> = { ...(savedTask.data as Partial<TenantCreatePayload>) };
      delete safeValue.temporaryPassword;
      this.tenantForm.patchValue(safeValue);
      this.syncSelectedLocationValues();
      if (safeValue.countryId) {
        await this.data.loadCities(safeValue.countryId);
        if (!this.data.findCityById(safeValue.cityId)) {
          this.tenantForm.patchValue({ cityId: null });
          this.selectedCityValue.set("");
        } else {
          this.syncSelectedLocationValues();
        }
      } else {
        this.tenantForm.patchValue({ cityId: null });
        this.selectedCityValue.set("");
        this.data.clearCities();
      }
      this.taskService.removeTask(this.taskId);
    }
    this.autoSelectDefaultPlan();
  }

  onDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
    this.showSuccessModal.set(false);

    const value = this.tenantForm.getRawValue();
    const taskValue: Partial<typeof value> = { ...value };
    delete taskValue.temporaryPassword;
    if (!taskValue.countryId) {
      delete taskValue.cityId;
    }
    const hasData = value.centerName !== '' || value.subdomain !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Provisioning: ${value.centerName || 'New Tenant'}`,
        route: '/owner/tenants/create',
        data: taskValue,
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
      tenantUsername: '',
      domain: '.az-edumanage.com',
      temporaryPassword: '',
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false,
      countryId: null,
      cityId: null,
    });

    this.data.clearCities();
    this.selectedCountryValue.set('');
    this.selectedCityValue.set('');
    this.tenantTypeSearchQuery.set('');
    this.planSearchQuery.set('');
    this.citySearchQuery.set('');
    this.countrySearchQuery.set('');
    this.closeAllDropdowns();
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    this.submitStatus.set(null);
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    this.showSuccessModal.set(false);
    const rawValue = this.tenantForm.getRawValue();
    const payload = {
      ...rawValue,
      tenantUsername: String(rawValue.tenantUsername ?? '').trim(),
    } as TenantCreatePayload;

    this.data
      .createTenant(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.completeProvisioningSuccess();
        },
        error: (error: unknown) => {
          void this.handleSubmitError(error, payload);
        },
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

  setCityDropdownOpen(value: boolean): void {
    this.store.setCityDropdownOpen(value);
  }

  setCitySearchQuery(value: string): void {
    this.citySearchQuery.set(value);
  }

  selectCity(cityValue: string): void {
    const selectedCity = this.data.findCityByValue(cityValue);
    this.tenantForm.patchValue({ cityId: selectedCity?.id ?? null });
    this.selectedCityValue.set(selectedCity?.value ?? '');
    this.store.setCityDropdownOpen(false);
    this.citySearchQuery.set('');
  }

  setCountryDropdownOpen(value: boolean): void {
    this.store.setCountryDropdownOpen(value);
  }

  setCountrySearchQuery(value: string): void {
    this.countrySearchQuery.set(value);
  }

  selectCountry(countryValue: string): void {
    const selectedCountry = this.data.findCountryByValue(countryValue);
    this.tenantForm.patchValue({
      countryId: selectedCountry?.id ?? null,
      cityId: null,
    });
    this.selectedCountryValue.set(selectedCountry?.value ?? '');
    this.selectedCityValue.set('');
    this.data.clearCities();
    this.store.setCountryDropdownOpen(false);
    this.store.setCityDropdownOpen(false);
    this.countrySearchQuery.set('');
    this.citySearchQuery.set('');
    if (selectedCountry) {
      void this.data.loadCities(selectedCountry.id);
    }
  }

  setPlanDropdownOpen(value: boolean): void {
    this.store.setPlanDropdownOpen(value);
  }

  setPlanSearchQuery(value: string): void {
    this.planSearchQuery.set(value);
  }

  selectPlan(planId: string): void {
    const control = this.tenantForm.get('planId');
    control?.setValue(planId);
    control?.markAsDirty();
    control?.markAsTouched();
    control?.updateValueAndValidity();
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

  private syncSelectedLocationValues(): void {
    const countryId = this.tenantForm.get('countryId')?.value;
    const cityId = this.tenantForm.get('cityId')?.value;
    this.selectedCountryValue.set(countryId == null ? '' : String(countryId));
    this.selectedCityValue.set(cityId == null ? '' : String(cityId));
  }

  private closeAllDropdowns(): void {
    this.store.setTenantTypeDropdownOpen(false);
    this.store.setPlanDropdownOpen(false);
    this.store.setDomainDropdownOpen(false);
    this.store.setCityDropdownOpen(false);
    this.store.setCountryDropdownOpen(false);
  }

  private autoSelectDefaultPlan(): void {
    const currentPlanId = this.tenantForm.get('planId')?.value;
    if (currentPlanId) {
      return;
    }

    const plans = this.subscriptionTemplates();
    const recommendedPlans = plans.filter((plan) => plan.popular);
    const planToSelect = recommendedPlans.length === 1
      ? recommendedPlans[0]
      : plans.length === 1
        ? plans[0]
        : null;

    if (planToSelect) {
      const control = this.tenantForm.get('planId');
      control?.setValue(planToSelect.id);
      control?.updateValueAndValidity();
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const maybeHttpError = error as { error?: { message?: unknown; details?: unknown }; message?: unknown };
      const backendMessage = typeof maybeHttpError.error?.message === 'string' ? maybeHttpError.error.message.trim() : '';
      const details = Array.isArray(maybeHttpError.error?.details) ? maybeHttpError.error.details.join(', ') : '';
      if (backendMessage) {
        return details ? backendMessage + ': ' + details : backendMessage;
      }
      if (typeof maybeHttpError.message === 'string' && maybeHttpError.message.trim()) {
        return maybeHttpError.message;
      }
    }

    return 'Tenant could not be provisioned.';
  }

  private async handleSubmitError(error: unknown, payload: TenantCreatePayload): Promise<void> {
    const message = this.extractErrorMessage(error);
    if (this.isAlreadyExistsError(message)) {
      try {
        const tenantWasProvisioned = await this.data.hasProvisionedTenant(
          payload.centerName,
          payload.subdomain,
        );
        if (tenantWasProvisioned) {
          this.completeProvisioningSuccess();
          return;
        }
      } catch {
        // Fall through to the original backend error when verification is unavailable.
      }
    }

    this.submitStatus.set({ success: false, message });
  }

  private completeProvisioningSuccess(): void {
    this.submitStatus.set({ success: true, message: 'Tenant provisioning verified successfully.' });
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.showSuccessModal.set(true);
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
    this.redirectTimer = setTimeout(() => {
      this.redirectTimer = null;
      void this.router.navigate(['/owner/tenants']);
    }, this.successRedirectDelayMs);
  }

  private isAlreadyExistsError(message: string): boolean {
    return message.trim().toLowerCase().includes('already exists');
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
