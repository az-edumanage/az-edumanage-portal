import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import { TENANT_STATUS_OPTIONS, Tenant, TenantStatus } from '../models/owner-tenants.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsListStore {
  private readonly data = inject(OwnerTenantsDataService);

  readonly searchQuery = signal('');
  readonly showFiltersDropdown = signal(false);
  readonly activeStatusDropdown = signal<string | null>(null);
  readonly activePlanDropdown = signal<string | null>(null);
  readonly pendingStatusChange = signal<{ tenant: Tenant; status: TenantStatus } | null>(null);
  readonly pendingPlanChange = signal<{ tenant: Tenant; plan: string } | null>(null);
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
}
