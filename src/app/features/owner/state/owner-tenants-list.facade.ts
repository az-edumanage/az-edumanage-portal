import { Injectable, inject } from '@angular/core';
import { OwnerTenantsListStore } from './owner-tenants-list.store';
import { ManualSettlementRequest, Tenant } from '../models/owner-tenants.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantsListFacade {
  private readonly store = inject(OwnerTenantsListStore);

  readonly searchQuery = this.store.searchQuery;
  readonly showFiltersDropdown = this.store.showFiltersDropdown;
  readonly activeStatusDropdown = this.store.activeStatusDropdown;
  readonly activePlanDropdown = this.store.activePlanDropdown;
  readonly pendingStatusChange = this.store.pendingStatusChange;
  readonly pendingPlanChange = this.store.pendingPlanChange;
  readonly pendingManualSettlement = this.store.pendingManualSettlement;
  readonly pendingPasswordChange = this.store.pendingPasswordChange;
  readonly pendingLifecycleStatusTenantIds = this.store.pendingLifecycleStatusTenantIds;
  readonly lifecycleStatusSubmissionError = this.store.lifecycleStatusSubmissionError;
  readonly manualSettlementSubmitting = this.store.manualSettlementSubmitting;
  readonly manualSettlementError = this.store.manualSettlementError;
  readonly passwordChangeSubmitting = this.store.passwordChangeSubmitting;
  readonly passwordChangeError = this.store.passwordChangeError;
  readonly passwordChangeNotification = this.store.passwordChangeNotification;
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

  confirmStatusChange(): Promise<boolean> {
    return this.store.confirmStatusChange();
  }

  cancelStatusChange(): void {
    this.store.cancelStatusChange();
  }

  beginLifecycleStatusSubmission(tenantId: string): boolean {
    return this.store.beginLifecycleStatusSubmission(tenantId);
  }

  finishLifecycleStatusSubmission(tenantId: string): void {
    this.store.finishLifecycleStatusSubmission(tenantId);
  }

  setLifecycleStatusSubmissionError(message: string | null): void {
    this.store.setLifecycleStatusSubmissionError(message);
  }

  isLifecycleStatusPending(tenantId: string): boolean {
    return this.store.isLifecycleStatusPending(tenantId);
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

  canManualSettle(tenant: Tenant): boolean {
    return this.store.canManualSettle(tenant);
  }

  requestManualSettlement(tenant: Tenant): void {
    this.store.requestManualSettlement(tenant);
  }

  cancelManualSettlement(): void {
    this.store.cancelManualSettlement();
  }

  submitManualSettlement(payload: ManualSettlementRequest): Promise<boolean> {
    return this.store.submitManualSettlement(payload);
  }

  requestPasswordChange(tenant: Tenant): void {
    this.store.requestPasswordChange(tenant);
  }

  cancelPasswordChange(): void {
    this.store.cancelPasswordChange();
  }

  submitPasswordChange(newPassword: string, confirmPassword: string): Promise<boolean> {
    return this.store.submitPasswordChange(newPassword, confirmPassword);
  }

  clearPasswordChangeNotification(): void {
    this.store.clearPasswordChangeNotification();
  }
}
