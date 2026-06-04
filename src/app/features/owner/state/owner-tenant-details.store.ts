import { Injectable, signal } from '@angular/core';
import {
  OwnerTenantDetails,
  OwnerTenantPlanOption,
  TenantBillingHistoryRow,
} from '../models/owner-tenant-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerTenantDetailsStore {
  readonly showPlanDropdown = signal(false);
  readonly pendingPlanId = signal<string | null>(null);
  readonly isUpgrading = signal(false);
  readonly tenant = signal<OwnerTenantDetails | null>(null);
  readonly plans = signal<OwnerTenantPlanOption[]>([]);
  readonly modules = signal<string[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly billingHistory = signal<TenantBillingHistoryRow[]>([]);
  readonly billingHistoryLoading = signal(false);
  readonly billingHistoryError = signal<string | null>(null);

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setTenant(tenant: OwnerTenantDetails | null): void {
    this.tenant.set(tenant);
  }

  setPlans(plans: OwnerTenantPlanOption[]): void {
    this.plans.set(plans);
  }

  setModules(modules: string[]): void {
    this.modules.set(modules);
  }

  setLoadError(message: string | null): void {
    this.loadError.set(message);
  }

  setBillingHistory(rows: TenantBillingHistoryRow[]): void {
    this.billingHistory.set(rows);
  }

  setBillingHistoryLoading(value: boolean): void {
    this.billingHistoryLoading.set(value);
  }

  setBillingHistoryError(message: string | null): void {
    this.billingHistoryError.set(message);
  }

  resetBillingHistoryState(): void {
    this.billingHistory.set([]);
    this.billingHistoryLoading.set(false);
    this.billingHistoryError.set(null);
  }

  setNotFound(value: boolean): void {
    this.notFound.set(value);
  }

  resetLoadState(): void {
    this.tenant.set(null);
    this.plans.set([]);
    this.modules.set([]);
    this.pendingPlanId.set(null);
    this.loadError.set(null);
    this.notFound.set(false);
  }

  setUpgrading(value: boolean): void {
    this.isUpgrading.set(value);
  }
}
