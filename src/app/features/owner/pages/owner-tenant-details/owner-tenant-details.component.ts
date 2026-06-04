import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { OwnerTenantDetailsFacade } from '../../state/owner-tenant-details.facade';
import { OwnerTenantDetails } from '../../models/owner-tenant-details.models';

@Component({
  selector: 'app-owner-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-tenant-details.component.html',
  styleUrl: './owner-tenant-details.component.css'
})
export class OwnerTenantDetailsComponent implements OnInit {
  private readonly facade = inject(OwnerTenantDetailsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly showPlanDropdown = this.facade.showPlanDropdown;
  readonly pendingPlanId = this.facade.pendingPlanId;
  readonly isUpgrading = this.facade.isUpgrading;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly notFound = this.facade.notFound;
  readonly billingHistoryLoading = this.facade.billingHistoryLoading;
  readonly billingHistoryError = this.facade.billingHistoryError;

  get plans() {
    return this.facade.plans;
  }

  get tenant(): OwnerTenantDetails {
    return this.facade.tenant;
  }

  get modules() {
    return this.facade.modules;
  }

  get billingHistory() {
    return this.facade.billingHistory;
  }

  get billingStatus(): string {
    return this.facade.billingStatus;
  }

  get openInvoice() {
    return this.facade.openInvoice;
  }

  get tenantStatusClasses(): string {
    return this.tenant.isActive
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => Boolean(id)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tenantId) => this.facade.initialize(tenantId));
  }

  selectPlan(planId: string): void {
    this.facade.selectPlan(planId);
  }

  confirmUpgrade(): void {
    this.facade.confirmUpgrade();
  }

  cancelUpgrade(): void {
    this.facade.cancelUpgrade();
  }

  getCurrentPlanPrice(): string {
    return this.facade.getCurrentPlanPrice();
  }

  getPendingPlanName(): string {
    return this.facade.getPendingPlanName();
  }

  impersonate(): void {
    this.facade.impersonate();
  }

  goBack(): void {
    this.facade.goBack();
  }
}
