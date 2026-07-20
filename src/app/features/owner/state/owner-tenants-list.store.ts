import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import {
  ManualSettlementRequest,
  OwnerTenantAssignablePlan,
  TENANT_STATUS_OPTIONS,
  Tenant,
  TenantStatus,
  toManualTenantLifecycleTargetStatus,
} from '../models/owner-tenants.models';

const DEFAULT_LIFECYCLE_STATUS_CHANGE_REASON = 'Owner manual lifecycle change from /owner/tenants';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsListStore {
  private readonly data = inject(OwnerTenantsDataService);

  readonly searchQuery = signal('');
  readonly showFiltersDropdown = signal(false);
  readonly activeStatusDropdown = signal<string | null>(null);
  readonly activePlanDropdown = signal<string | null>(null);
  readonly pendingStatusChange = signal<{ tenant: Tenant; status: TenantStatus } | null>(null);
  readonly pendingPlanChange = signal<{ tenant: Tenant; plan: OwnerTenantAssignablePlan } | null>(null);
  readonly pendingManualSettlement = signal<Tenant | null>(null);
  readonly pendingPasswordChange = signal<Tenant | null>(null);
  readonly pendingLifecycleStatusTenantIds = signal<Set<string>>(new Set());
  readonly lifecycleStatusSubmissionError = signal<string | null>(null);
  readonly manualSettlementSubmitting = signal(false);
  readonly manualSettlementError = signal<string | null>(null);
  readonly planChangeSubmitting = signal(false);
  readonly planChangeError = signal<string | null>(null);
  readonly planChangeNotification = signal<string | null>(null);
  readonly passwordChangeSubmitting = signal(false);
  readonly passwordChangeError = signal<string | null>(null);
  readonly passwordChangeNotification = signal<string | null>(null);
  readonly copyNotification = signal<string | null>(null);

  readonly selectedStatuses = signal<Set<string>>(new Set());
  readonly selectedPlans = signal<Set<string>>(new Set());
  readonly selectedHealths = signal<Set<string>>(new Set());

  readonly statuses = computed(() => TENANT_STATUS_OPTIONS);
  readonly plans = computed(() => Array.from(new Set([
    ...this.data.planOptions().map((plan) => plan.name),
    ...this.data.tenants().map((tenant) => tenant.plan),
  ])).sort((left, right) => left.localeCompare(right)));
  readonly healths = ['Healthy', 'Degraded', 'Down'];

  readonly activeFilterCount = computed(
    () => this.selectedStatuses().size + this.selectedPlans().size + this.selectedHealths().size,
  );

  readonly filteredTenants = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const statuses = this.selectedStatuses();
    const plans = this.selectedPlans();
    const healths = this.selectedHealths();

    return this.data.tenants().filter((tenant) => {
      const matchesSearch =
        !search ||
        tenant.name.toLowerCase().includes(search) ||
        tenant.tenantType.toLowerCase().includes(search) ||
        tenant.fullName.toLowerCase().includes(search) ||
        tenant.phoneNumber.toLowerCase().includes(search) ||
        tenant.id.toLowerCase().includes(search) ||
        tenant.ownerEmail.toLowerCase().includes(search);
      const matchesStatus = statuses.size === 0 || statuses.has(tenant.status);
      const matchesPlan = plans.size === 0 || plans.has(tenant.plan);
      const matchesHealth = healths.size === 0 || healths.has(tenant.healthStatus);

      return matchesSearch && matchesStatus && matchesPlan && matchesHealth;
    });
  });

  toggleFilter(type: 'status' | 'plan' | 'health', value: string): void {
    const set =
      type === 'status'
        ? this.selectedStatuses()
        : type === 'plan'
          ? this.selectedPlans()
          : this.selectedHealths();

    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }

    if (type === 'status') {
      this.selectedStatuses.set(next);
      return;
    }

    if (type === 'plan') {
      this.selectedPlans.set(next);
      return;
    }

    this.selectedHealths.set(next);
  }

  clearFilters(): void {
    this.selectedStatuses.set(new Set());
    this.selectedPlans.set(new Set());
    this.selectedHealths.set(new Set());
  }

  requestStatusChange(tenant: Tenant, newStatus: string): void {
    if (
      tenant.status === newStatus ||
      this.isLifecycleStatusPending(tenant.id) ||
      toManualTenantLifecycleTargetStatus(newStatus) === null
    ) {
      return;
    }
    this.pendingStatusChange.set({ tenant, status: newStatus as TenantStatus });
  }

  async confirmStatusChange(): Promise<boolean> {
    const pending = this.pendingStatusChange();
    if (!pending) {
      return false;
    }

    const targetStatus = toManualTenantLifecycleTargetStatus(pending.status);
    if (targetStatus === null) {
      this.lifecycleStatusSubmissionError.set('Unsupported lifecycle status selected.');
      this.pendingStatusChange.set(null);
      return false;
    }

    if (!this.beginLifecycleStatusSubmission(pending.tenant.id)) {
      return false;
    }

    this.pendingStatusChange.set(null);

    try {
      await this.data.changeTenantLifecycleStatus(pending.tenant.id, {
        targetStatus,
        reason: DEFAULT_LIFECYCLE_STATUS_CHANGE_REASON,
      });
      return true;
    } catch (error) {
      this.lifecycleStatusSubmissionError.set(this.toLifecycleOwnerFacingErrorMessage(error));
      return false;
    } finally {
      this.finishLifecycleStatusSubmission(pending.tenant.id);
    }
  }

  cancelStatusChange(): void {
    this.pendingStatusChange.set(null);
  }

  beginLifecycleStatusSubmission(tenantId: string): boolean {
    const current = this.pendingLifecycleStatusTenantIds();
    if (current.has(tenantId)) {
      return false;
    }

    const next = new Set(current);
    next.add(tenantId);
    this.pendingLifecycleStatusTenantIds.set(next);
    this.lifecycleStatusSubmissionError.set(null);
    return true;
  }

  finishLifecycleStatusSubmission(tenantId: string): void {
    const current = this.pendingLifecycleStatusTenantIds();
    if (!current.has(tenantId)) {
      return;
    }

    const next = new Set(current);
    next.delete(tenantId);
    this.pendingLifecycleStatusTenantIds.set(next);
  }

  setLifecycleStatusSubmissionError(message: string | null): void {
    this.lifecycleStatusSubmissionError.set(message);
  }

  isLifecycleStatusPending(tenantId: string): boolean {
    return this.pendingLifecycleStatusTenantIds().has(tenantId);
  }

  availablePlansForTenant(tenant: Tenant): OwnerTenantAssignablePlan[] {
    return this.data.planOptions()
      .filter((plan) => plan.audienceType === tenant.tenantType)
      .sort((left, right) => {
        if (left.trialPlan !== right.trialPlan) {
          return left.trialPlan ? 1 : -1;
        }
        return left.name.localeCompare(right.name);
      });
  }

  requestPlanChange(tenant: Tenant, newPlan: OwnerTenantAssignablePlan): void {
    if (tenant.plan === newPlan.name || newPlan.status !== 'Active') {
      return;
    }
    this.planChangeError.set(null);
    this.pendingPlanChange.set({ tenant, plan: newPlan });
  }

  async confirmPlanChange(): Promise<boolean> {
    const pending = this.pendingPlanChange();
    if (!pending || this.planChangeSubmitting()) {
      return false;
    }

    this.planChangeSubmitting.set(true);
    this.planChangeError.set(null);
    try {
      const updatedTenant = await this.data.changeTenantPlan(pending.tenant.id, pending.plan.id);
      this.pendingPlanChange.set(null);
      this.planChangeNotification.set(
        `${updatedTenant.name} now uses ${updatedTenant.plan} as a ${updatedTenant.subscriptionType} tenant.`,
      );
      return true;
    } catch (error) {
      this.planChangeError.set(this.toPlanChangeErrorMessage(error));
      return false;
    } finally {
      this.planChangeSubmitting.set(false);
    }
  }

  cancelPlanChange(): void {
    if (this.planChangeSubmitting()) {
      return;
    }
    this.planChangeError.set(null);
    this.pendingPlanChange.set(null);
  }

  clearPlanChangeNotification(): void {
    this.planChangeNotification.set(null);
  }

  canManualSettle(tenant: Tenant): boolean {
    const eligibleProviderStatuses = new Set(['failed', 'cancelled', 'expired']);
    return (
      eligibleProviderStatuses.has(tenant.providerPaymentStatus) &&
      tenant.settlementStatus !== 'manual_paid' &&
      tenant.settlementStatus !== 'provider_paid' &&
      tenant.ownerDisplayStatus !== 'active'
    );
  }

  requestManualSettlement(tenant: Tenant): void {
    if (!this.canManualSettle(tenant)) {
      return;
    }

    this.manualSettlementError.set(null);
    this.pendingManualSettlement.set(tenant);
  }

  cancelManualSettlement(): void {
    if (this.manualSettlementSubmitting()) {
      return;
    }

    this.manualSettlementError.set(null);
    this.pendingManualSettlement.set(null);
  }

  async submitManualSettlement(payload: ManualSettlementRequest): Promise<boolean> {
    const tenant = this.pendingManualSettlement();
    if (!tenant || this.manualSettlementSubmitting()) {
      return false;
    }

    this.manualSettlementSubmitting.set(true);
    this.manualSettlementError.set(null);

    try {
      await this.data.recordManualSettlement(tenant.id, payload);
      this.pendingManualSettlement.set(null);
      return true;
    } catch (error) {
      this.manualSettlementError.set(this.toOwnerFacingErrorMessage(error));
      return false;
    } finally {
      this.manualSettlementSubmitting.set(false);
    }
  }

  requestPasswordChange(tenant: Tenant): void {
    this.passwordChangeError.set(null);
    this.pendingPasswordChange.set(tenant);
  }

  cancelPasswordChange(): void {
    if (this.passwordChangeSubmitting()) {
      return;
    }
    this.passwordChangeError.set(null);
    this.pendingPasswordChange.set(null);
  }

  async submitPasswordChange(newPassword: string, confirmPassword: string): Promise<boolean> {
    const tenant = this.pendingPasswordChange();
    if (!tenant || this.passwordChangeSubmitting()) {
      return false;
    }

    this.passwordChangeSubmitting.set(true);
    this.passwordChangeError.set(null);
    try {
      const result = await this.data.changeTenantPassword(tenant.id, newPassword, confirmPassword);
      this.pendingPasswordChange.set(null);
      this.passwordChangeNotification.set(`Password changed for ${tenant.name} (${result.username}).`);
      return true;
    } catch (error) {
      this.passwordChangeError.set(this.toPasswordChangeErrorMessage(error));
      return false;
    } finally {
      this.passwordChangeSubmitting.set(false);
    }
  }

  clearPasswordChangeNotification(): void {
    this.passwordChangeNotification.set(null);
  }

  private toOwnerFacingErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
      if (message) {
        return message;
      }
    }

    return 'Manual settlement could not be recorded. Please review the details and try again.';
  }

  private toLifecycleOwnerFacingErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
      const firstDetail =
        Array.isArray(error.error?.details) && typeof error.error.details[0] === 'string'
          ? error.error.details[0].trim()
          : '';
      if (message.toLowerCase() === 'validation failed' && firstDetail) {
        return firstDetail;
      }
      if (message) {
        return message;
      }
      if (firstDetail) {
        return firstDetail;
      }
    }

    return 'Tenant lifecycle status could not be updated. Please try again.';
  }

  private toPasswordChangeErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
      const firstDetail =
        Array.isArray(error.error?.details) && typeof error.error.details[0] === 'string'
          ? error.error.details[0].trim()
          : '';
      if (message.toLowerCase() === 'validation failed' && firstDetail) {
        return firstDetail;
      }
      if (message) {
        return message;
      }
      if (firstDetail) {
        return firstDetail;
      }
    }
    return 'Tenant password could not be changed. Please try again.';
  }

  private toPlanChangeErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
      if (message) {
        return message;
      }
    }
    return 'Tenant plan could not be changed. Please try again.';
  }
}
