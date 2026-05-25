import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import {
  ManualSettlementRequest,
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
  readonly pendingPlanChange = signal<{ tenant: Tenant; plan: string } | null>(null);
  readonly pendingManualSettlement = signal<Tenant | null>(null);
  readonly pendingLifecycleStatusTenantIds = signal<Set<string>>(new Set());
  readonly lifecycleStatusSubmissionError = signal<string | null>(null);
  readonly manualSettlementSubmitting = signal(false);
  readonly manualSettlementError = signal<string | null>(null);
  readonly copyNotification = signal<string | null>(null);

  readonly selectedStatuses = signal<Set<string>>(new Set());
  readonly selectedPlans = signal<Set<string>>(new Set());
  readonly selectedHealths = signal<Set<string>>(new Set());

  readonly statuses = computed(() => TENANT_STATUS_OPTIONS);
  readonly plans = ['Starter', 'Professional', 'Enterprise'];
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

  requestPlanChange(tenant: Tenant, newPlan: string): void {
    if (tenant.plan === newPlan) {
      return;
    }
    this.pendingPlanChange.set({ tenant, plan: newPlan });
  }

  confirmPlanChange(): void {
    const pending = this.pendingPlanChange();
    if (!pending) {
      return;
    }

    this.data.updateTenantPlan(pending.tenant.id, pending.plan);
    this.pendingPlanChange.set(null);
  }

  cancelPlanChange(): void {
    this.pendingPlanChange.set(null);
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
      if (message) {
        return message;
      }
    }

    return 'Tenant lifecycle status could not be updated. Please try again.';
  }
}
