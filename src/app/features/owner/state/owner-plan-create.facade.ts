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
  readonly existingPlans = this.data.existingPlans;

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

  readonly planForm = this.fb.group({
    name: ['', [Validators.required, this.checkExistingPlanName()]],
    description: [''],
    status: ['Active', Validators.required],
    visibility: ['Public', Validators.required],
    currency: ['USD', Validators.required],
    monthlyPrice: [0, [Validators.required, Validators.min(0)]],
    yearlyPrice: [0, [Validators.required, Validators.min(0)]],
    hasTrial: [true],
    trialDays: [14, [Validators.required, Validators.min(0)]],
    maxStudents: [100, [Validators.required]],
    maxTeachers: [10, [Validators.required]],
    maxStorage: [5, [Validators.required]],
    maxBranches: [1, [Validators.required]],
    modules: this.fb.group({
      academicStructure: [true],
      studentsManagement: [true],
      scheduling: [true],
      usersManagement: [true],
      auditLogs: [true],
      examsAndGrades: [false],
      finance: [false],
      smsIntegration: [false],
      advancedAnalytics: [false],
      parentPortal: [false],
      lms: [false],
      questionBank: [false],
    }),
    autoRenew: [true],
    allowDowngrade: [false],
  });

  initialize(planId: string | null): void {
    this.store.setPlanId(planId);

    if (planId) {
      const plan = this.data.getPlanById(planId);
      if (plan) {
        this.planForm.patchValue(plan);
      }
    }

    const savedTask = this.taskService.getTask(this.store.effectiveTaskId());
    if (savedTask?.data) {
      this.planForm.patchValue(savedTask.data as Partial<OwnerPlanCreatePayload>);
      this.taskService.removeTask(this.store.effectiveTaskId());
    }
  }

  onDestroy(): void {
    const value = this.planForm.getRawValue();
    const hasData = value.name !== '' || value.description !== '';

    if (hasData && !this.isSuccess) {
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

    const payload = this.planForm.getRawValue() as OwnerPlanCreatePayload;
    this.data
      .createOrUpdatePlan(payload)
      .pipe(finalize(() => void 0))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.effectiveTaskId());
        this.router.navigate(['/owner/plans']);
      });
  }

  private checkExistingPlanName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const duplicate = this.data.isPlanNameTaken(control.value, this.planId());
      if (!duplicate) {
        return null;
      }

      return { alreadyExists: duplicate };
    };
  }
}
