import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import { ManualSettlementRequest, TENANT_STATUS_OPTIONS, Tenant, TenantStatus } from '../models/owner-tenants.models';

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
    if (tenant.status === newStatus) {
      return;
    }
    this.pendingStatusChange.set({ tenant, status: newStatus as TenantStatus });
  }

  confirmStatusChange(): void {
    if (!this.pendingStatusChange()) {
      return;
    }
    this.pendingStatusChange.set(null);
  }

  cancelStatusChange(): void {
    this.pendingStatusChange.set(null);
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
}
