import { Component, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OwnerTenantDetailsFacade } from '../../state/owner-tenant-details.facade';

@Component({
  selector: 'app-owner-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TitleCasePipe],
  templateUrl: './owner-tenant-details.component.html'})
export class OwnerTenantDetailsComponent {
  private readonly facade = inject(OwnerTenantDetailsFacade);

  readonly showPlanDropdown = this.facade.showPlanDropdown;
  readonly pendingPlanId = this.facade.pendingPlanId;
  readonly isUpgrading = this.facade.isUpgrading;

  readonly plans = this.facade.plans;
  readonly tenant = this.facade.tenant;
  readonly modules = this.facade.modules;

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
