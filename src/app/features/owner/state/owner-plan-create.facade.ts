import { Injectable, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
import { OwnerPlanCreateDataService } from '../data-access/owner-plan-create-data.service';
import {
  OwnerPlanCreatePayload,
  OwnerPlanCurrency,
  OwnerPlanStatus,
  OwnerPlanVisibility,
} from '../models/owner-plan-create.models';
import { OwnerPlanCreateStore } from './owner-plan-create.store';

@Injectable({ providedIn: 'root' })
export class OwnerPlanCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(OwnerPlanCreateDataService);
  private readonly store = inject(OwnerPlanCreateStore);

  private isSuccess = false;
  private subscriptionsInitialized = false;

  readonly isEditMode = this.store.isEditMode;
  readonly planId = this.store.planId;

  readonly showStatusDropdown = this.store.showStatusDropdown;
  readonly statusSearchQuery = this.store.statusSearchQuery;
  readonly showVisibilityDropdown = this.store.showVisibilityDropdown;
  readonly visibilitySearchQuery = this.store.visibilitySearchQuery;
  readonly showCurrencyDropdown = this.store.showCurrencyDropdown;
  readonly currencySearchQuery = this.store.currencySearchQuery;

  readonly statuses = this.data.statuses.map((item) => item.name);
  readonly visibilities = this.data.visibilities;
  readonly currencies = this.data.currencies;

  readonly filteredStatuses = computed(() => {
    const query = this.statusSearchQuery().toLowerCase();
    return this.statuses.filter((status) => status.toLowerCase().includes(query));
  });

  readonly filteredVisibilities = computed(() => {
    const query = this.visibilitySearchQuery().toLowerCase();
    return this.visibilities.filter((visibility) => visibility.label.toLowerCase().includes(query));
  });

  readonly filteredCurrencies = computed(() => {
    const query = this.currencySearchQuery().toLowerCase();
    return this.currencies.filter((currency) => currency.label.toLowerCase().includes(query));
  });

  readonly moduleOptions = this.store.moduleOptions;
  readonly existingPlans = this.store.existingPlans;
  readonly isSubmitting = this.store.isSubmitting;
  readonly actionStatus = this.store.actionStatus;

  readonly planForm = this.fb.group({
    name: ['', [Validators.required, this.checkExistingPlanName()]],
    description: [''],
    status: ['', Validators.required],
    visibility: ['', Validators.required],
    currency: ['', Validators.required],
    monthlyPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    yearlyPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    hasTrial: [false],
    trialDays: [{ value: null as number | null, disabled: true }],
    maxStudents: [null as number | null, [Validators.required, Validators.min(0)]],
    maxTeachers: [null as number | null, [Validators.required, Validators.min(0)]],
    maxStorage: [null as number | null, [Validators.required, Validators.min(0)]],
    maxBranches: [null as number | null, [Validators.required, Validators.min(0)]],
    moduleIds: this.fb.nonNullable.control<string[]>([], [Validators.required]),
    autoRenew: [false],
    allowDowngrade: [false],
    isRecommended: [false],
    showAnnualPrice: [false],
  });

  async initialize(planId: string | null): Promise<void> {
    this.store.setPlanId(planId);
    this.store.setActionStatus(null);
    this.store.setSubmitting(false);
    this.planForm.reset({
      name: '',
      description: '',
      status: '',
      visibility: '',
      currency: '',
      monthlyPrice: null,
      yearlyPrice: null,
      hasTrial: false,
      trialDays: null,
      maxStudents: null,
      maxTeachers: null,
      maxStorage: null,
      maxBranches: null,
      moduleIds: [],
      autoRenew: false,
      allowDowngrade: false,
      isRecommended: false,
      showAnnualPrice: false,
    });
    this.planForm.markAsPristine();
    this.planForm.markAsUntouched();

    this.store.existingPlans.set(await this.data.listPlans());
    this.store.moduleOptions.set(await this.data.listModuleOptions());

    if (planId) {
      const plan = await this.data.getPlanById(planId);
      if (plan) {
        this.planForm.patchValue(plan);
      }
    }

    const savedTask = this.taskService.getTask(this.store.effectiveTaskId());
    if (savedTask?.data) {
      this.planForm.patchValue(savedTask.data as Partial<OwnerPlanCreatePayload>);
      this.taskService.removeTask(this.store.effectiveTaskId());
    }

    if (!this.subscriptionsInitialized) {
      this.subscriptionsInitialized = true;

      this.planForm.get('monthlyPrice')?.valueChanges.subscribe((monthlyPrice) => {
        const yearlyControl = this.planForm.get('yearlyPrice');
        if (!yearlyControl) return;
        if (monthlyPrice === null || monthlyPrice === undefined) {
          yearlyControl.setValue(null, { emitEvent: false });
          return;
        }
        const monthly = Number(monthlyPrice);
        yearlyControl.setValue(Number.isFinite(monthly) ? monthly * 12 : null, { emitEvent: false });
      });

      this.planForm.get('hasTrial')?.valueChanges.subscribe((enabled) => {
        const trialDaysControl = this.planForm.get('trialDays');
        if (!trialDaysControl) return;
        if (enabled) {
          trialDaysControl.enable({ emitEvent: false });
          trialDaysControl.setValidators([Validators.required, Validators.min(1)]);
          if (trialDaysControl.value == null) {
            trialDaysControl.setValue(14, { emitEvent: false });
          }
        } else {
          trialDaysControl.setValidators([]);
          trialDaysControl.setValue(0, { emitEvent: false });
          trialDaysControl.disable({ emitEvent: false });
        }
        trialDaysControl.updateValueAndValidity({ emitEvent: false });
      });
    }

    const hasTrial = !!this.planForm.get('hasTrial')?.value;
    const trialDaysControl = this.planForm.get('trialDays');
    if (trialDaysControl) {
      if (hasTrial) {
        trialDaysControl.enable({ emitEvent: false });
        trialDaysControl.setValidators([Validators.required, Validators.min(1)]);
        if (trialDaysControl.value == null || trialDaysControl.value === 0) {
          trialDaysControl.setValue(14, { emitEvent: false });
        }
      } else {
        trialDaysControl.setValidators([]);
        trialDaysControl.setValue(0, { emitEvent: false });
        trialDaysControl.disable({ emitEvent: false });
      }
      trialDaysControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  onDestroy(): void {
    if (this.planForm.dirty && !this.isSuccess && !this.isSubmitting()) {
      const value = this.planForm.getRawValue();
      this.taskService.addTask({
        id: this.store.effectiveTaskId(),
        type: 'form',
        label: `Creating Plan: ${value.name || 'New Plan'}`,
        route: '/owner/plans/create',
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.effectiveTaskId());
    this.router.navigate(['/owner/plans']);
  }

  selectStatus(status: string): void {
    this.planForm.patchValue({ status: status as OwnerPlanStatus });
    this.showStatusDropdown.set(false);
    this.statusSearchQuery.set('');
  }

  selectVisibility(visibility: string): void {
    this.planForm.patchValue({ visibility: visibility as OwnerPlanVisibility });
    this.showVisibilityDropdown.set(false);
    this.visibilitySearchQuery.set('');
  }

  selectCurrency(currency: string): void {
    this.planForm.patchValue({ currency: currency as OwnerPlanCurrency });
    this.showCurrencyDropdown.set(false);
    this.currencySearchQuery.set('');
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    this.store.setActionStatus(null);

    const value = this.planForm.getRawValue();
    const payload: OwnerPlanCreatePayload = {
      name: value.name ?? '',
      description: value.description ?? '',
      status: (value.status || 'Draft') as OwnerPlanStatus,
      visibility: (value.visibility || 'Private') as OwnerPlanVisibility,
      currency: (value.currency || 'USD') as OwnerPlanCurrency,
      monthlyPrice: value.monthlyPrice ?? 0,
      yearlyPrice: value.yearlyPrice ?? 0,
      hasTrial: value.hasTrial ?? false,
      trialDays: value.hasTrial ? (value.trialDays ?? 14) : 0,
      maxStudents: value.maxStudents ?? 0,
      maxTeachers: value.maxTeachers ?? 0,
      maxStorage: value.maxStorage ?? 0,
      maxBranches: value.maxBranches ?? 0,
      moduleIds: value.moduleIds ?? [],
      autoRenew: value.autoRenew ?? false,
      allowDowngrade: value.allowDowngrade ?? false,
      isRecommended: value.isRecommended ?? false,
      showAnnualPrice: value.showAnnualPrice ?? false,
    };
    this.data
      .createOrUpdatePlan(payload, this.planId())
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.taskService.removeTask(this.store.effectiveTaskId());
          this.store.setActionStatus({
            success: true,
            message: this.isEditMode() ? 'Plan updated successfully.' : 'Plan created successfully.',
          });
        },
        error: (error: unknown) => {
          this.store.setActionStatus({
            success: false,
            message: this.extractErrorMessage(error),
          });
        },
      });
  }

  closeActionStatus(): void {
    const status = this.actionStatus();
    this.store.setActionStatus(null);
    if (status?.success) {
      this.router.navigate(['/owner/plans']);
    }
  }

  isModuleSelected(moduleId: string): boolean {
    return this.planForm.controls.moduleIds.value.includes(moduleId);
  }

  toggleModule(moduleId: string): void {
    const current = this.planForm.controls.moduleIds.value;
    if (current.includes(moduleId)) {
      this.planForm.controls.moduleIds.setValue(current.filter((id) => id !== moduleId));
      return;
    }
    this.planForm.controls.moduleIds.setValue([...current, moduleId]);
  }

  private checkExistingPlanName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const duplicate = this.data.isPlanNameTaken(control.value, this.planId(), this.existingPlans());
      if (!duplicate) {
        return null;
      }

      return { alreadyExists: duplicate };
    };
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; details?: unknown };
      if (body?.message) {
        if (Array.isArray(body.details) && body.details.length > 0) {
          return `${body.message}: ${body.details.join(', ')}`;
        }
        return body.message;
      }
      return `Request failed with status ${error.status}.`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected error while saving plan.';
  }
}
