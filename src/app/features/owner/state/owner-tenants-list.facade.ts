import { Injectable, inject } from '@angular/core';
import { OwnerTenantsListStore } from './owner-tenants-list.store';
import { Tenant } from '../models/owner-tenants.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsListFacade {
  private readonly store = inject(OwnerTenantsListStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFiltersDropdown = this.store.showFiltersDropdown;
  readonly activeStatusDropdown = this.store.activeStatusDropdown;
  readonly activePlanDropdown = this.store.activePlanDropdown;
  readonly pendingStatusChange = this.store.pendingStatusChange;
  readonly pendingPlanChange = this.store.pendingPlanChange;
  readonly copyNotification = this.store.copyNotification;

  readonly selectedStatuses = this.store.selectedStatuses;
  readonly selectedPlans = this.store.selectedPlans;
  readonly selectedHealths = this.store.selectedHealths;

  readonly statuses = this.store.statuses;
  readonly plans = this.store.plans;
  readonly healths = this.store.healths;

  readonly activeFilterCount = this.store.activeFilterCount;
  readonly filteredTenants = this.store.filteredTenants;

  toggleFilter(type: 'status' | 'plan' | 'health', value: string): void {
    this.store.toggleFilter(type, value);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  requestStatusChange(tenant: Tenant, newStatus: string): void {
    this.store.requestStatusChange(tenant, newStatus);
  }

  confirmStatusChange(): void {
    this.store.confirmStatusChange();
  }

  cancelStatusChange(): void {
    this.store.cancelStatusChange();
  }

  requestPlanChange(tenant: Tenant, newPlan: string): void {
    this.store.requestPlanChange(tenant, newPlan);
  }

  confirmPlanChange(): void {
    this.store.confirmPlanChange();
  }

  cancelPlanChange(): void {
    this.store.cancelPlanChange();
  }
}
