import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerApiService } from '../data-access/owner-api.service';
import { OwnerTenantDetailsDataService } from '../data-access/owner-tenant-details-data.service';
import { OwnerTenantDetailsStore } from './owner-tenant-details.store';

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

  readonly plans = this.data.plans;
  readonly tenant = this.data.tenant;
  readonly modules = this.data.modules;

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
    if (!newPlanId || this.isUpgrading()) {
      return;
    }

    this.store.setUpgrading(true);

    this.ownerApi.upgradeTenantPlan(this.tenant.id, newPlanId).subscribe(() => {
      this.tenant.planId = newPlanId;
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
    return this.data.getPlanName(this.pendingPlanId());
  }

  impersonate(): void {
    this.dashboardService.returnUrl.set(this.router.url);

    if (this.tenant.tenantType === 'Individual Teacher') {
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
