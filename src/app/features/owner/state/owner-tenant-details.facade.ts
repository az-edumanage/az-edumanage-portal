import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerApiService } from '../data-access/owner-api.service';
import { OwnerTenantDetailsDataService } from '../data-access/owner-tenant-details-data.service';
import { OwnerTenantDetails } from '../models/owner-tenant-details.models';
import { OwnerTenantDetailsStore } from './owner-tenant-details.store';

const EMPTY_TENANT: OwnerTenantDetails = {
  id: '—',
  centerName: '—',
  tenantType: '—',
  subdomain: '—',
  domain: '—',
  industry: '—',
  contactName: '—',
  contactEmail: '—',
  contactPhone: '—',
  address: '—',
  city: '—',
  country: '—',
  planId: '—',
  planName: '—',
  isTrial: false,
  trialDays: 0,
  region: '—',
  autoProvision: false,
  sendInvite: false,
  onboardingLink: false,
  sendOnboardingWhatsapp: false,
  sendOnboardingEmail: false,
  schemaName: '—',
  provisioningStatus: '—',
  provisioningError: '—',
  isActive: false,
  tenantOperationalStatus: '—',
  ownerDisplayStatus: '—',
  subscriptionState: '—',
  subscriptionType: '—',
  subscriptionStartedAt: '—',
  currentPeriodStartAt: '—',
  currentPeriodEndAt: '—',
  billingStatus: '—',
  openInvoice: null,
  providerPaymentStatus: '—',
  settlementStatus: '—',
  createdBy: '—',
  provisioningSource: '—',
  provisioningTriggeredBy: '—',
  status: '—',
  createdDate: '—',
  updatedDate: '—',
  addressDisplay: '—',
  tenantUrl: '—',
  nextBillingDate: '—',
  usageStudents: '—',
  usageStudentsLimit: '—',
  usageStorage: '—',
  usageStorageLimit: '—',
  usageApiCalls: '—',
  usageApiCallsLimit: '—',
};

@Injectable({ providedIn: 'root' })
export class OwnerTenantDetailsFacade {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dashboardService = inject(DashboardService);
  private readonly ownerApi = inject(OwnerApiService);
  private readonly data = inject(OwnerTenantDetailsDataService);
  private readonly store = inject(OwnerTenantDetailsStore);

  readonly showPlanDropdown = this.store.showPlanDropdown;
  readonly pendingPlanId = this.store.pendingPlanId;
  readonly isUpgrading = this.store.isUpgrading;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;
  readonly notFound = this.store.notFound;
  readonly billingHistoryLoading = this.store.billingHistoryLoading;
  readonly billingHistoryError = this.store.billingHistoryError;

  get plans() {
    return this.store.plans();
  }

  get tenant(): OwnerTenantDetails {
    return this.store.tenant() ?? EMPTY_TENANT;
  }

  get modules() {
    return this.store.modules();
  }

  get billingHistory() {
    return this.store.billingHistory();
  }

  get billingStatus(): string {
    return this.tenant.billingStatus;
  }

  get openInvoice() {
    return this.tenant.openInvoice;
  }

  initialize(tenantId: string): void {
    this.store.resetLoadState();
    this.loadBillingHistory(tenantId);
    this.store.setLoading(true);

    this.data.getTenantById(tenantId).subscribe({
      next: (tenant) => {
        this.store.setTenant(tenant);
        this.store.setPlans(this.data.getPlanOptions(tenant));
        this.store.setModules([]);
        this.store.setLoading(false);
      },
      error: (error: unknown) => {
        this.store.setTenant(null);
        this.store.setPlans([]);
        this.store.setModules([]);
        this.store.setNotFound(error instanceof HttpErrorResponse && error.status === 404);
        this.store.setLoadError('Tenant details could not be loaded.');
        this.store.setLoading(false);
      },
    });
  }

  private loadBillingHistory(tenantId: string): void {
    this.store.resetBillingHistoryState();
    this.store.setBillingHistoryLoading(true);

    this.data.getTenantBillingHistory(tenantId).subscribe({
      next: (rows) => {
        this.store.setBillingHistory(rows);
        this.store.setBillingHistoryError(null);
        this.store.setBillingHistoryLoading(false);
      },
      error: () => {
        this.store.setBillingHistory([]);
        this.store.setBillingHistoryError('Billing history could not be loaded.');
        this.store.setBillingHistoryLoading(false);
      },
    });
  }

  selectPlan(planId: string): void {
    if (planId === this.tenant.planId) {
      this.pendingPlanId.set(null);
    } else {
      this.pendingPlanId.set(planId);
    }

    this.showPlanDropdown.set(false);
  }

  confirmUpgrade(): void {
    const newPlanId = this.pendingPlanId();
    const currentTenant = this.store.tenant();
    if (!newPlanId || !currentTenant || this.isUpgrading()) {
      return;
    }

    this.store.setUpgrading(true);

    this.ownerApi.upgradeTenantPlan(currentTenant.id, newPlanId).subscribe(() => {
      this.store.setTenant({ ...currentTenant, planId: newPlanId });
      this.pendingPlanId.set(null);
      this.store.setUpgrading(false);
    });
  }

  cancelUpgrade(): void {
    this.pendingPlanId.set(null);
  }

  getCurrentPlanPrice(): string {
    return this.data.getPlanPrice(this.tenant.planId);
  }

  getPendingPlanName(): string {
    return this.data.getPlanName(this.pendingPlanId(), this.store.tenant());
  }

  impersonate(): void {
    const currentTenant = this.store.tenant();
    if (!currentTenant) {
      return;
    }

    this.dashboardService.returnUrl.set(this.router.url);

    if (currentTenant.tenantType === 'Individual Teacher') {
      this.dashboardService.setRole('teacher');
      this.router.navigate(['/teacher/overview']);
      return;
    }

    this.dashboardService.setRole('tenant');
    this.router.navigate(['/tenant/overview']);
  }

  goBack(): void {
    this.location.back();
  }
}
