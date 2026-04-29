import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { UiPagerButtonComponent } from '../../../../shared/ui';
import { OwnerTenantsListFacade } from '../../state/owner-tenants-list.facade';
import { Tenant } from '../../models/owner-tenants.models';

@Component({
  selector: 'app-owner-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, UiPagerButtonComponent],
  templateUrl: './owner-tenants-list.component.html',
  styleUrl: './owner-tenants-list.component.css'
})
export class OwnerTenantsListComponent {
  private router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly tenantsFacade = inject(OwnerTenantsListFacade);

  readonly searchQuery = this.tenantsFacade.searchQuery;
  readonly showFiltersDropdown = this.tenantsFacade.showFiltersDropdown;
  readonly activeStatusDropdown = this.tenantsFacade.activeStatusDropdown;
  readonly pendingStatusChange = this.tenantsFacade.pendingStatusChange;
  readonly activePlanDropdown = this.tenantsFacade.activePlanDropdown;
  readonly pendingPlanChange = this.tenantsFacade.pendingPlanChange;
  readonly copyNotification = this.tenantsFacade.copyNotification;
  readonly isRtl = this.i18nService.isRtl;
  t(text: string): string {
    return this.i18nService.t(text);
  }

  readonly selectedStatuses = this.tenantsFacade.selectedStatuses;
  readonly selectedPlans = this.tenantsFacade.selectedPlans;
  readonly selectedHealths = this.tenantsFacade.selectedHealths;

  readonly statuses = this.tenantsFacade.statuses;
  readonly plans = this.tenantsFacade.plans;
  readonly healths = this.tenantsFacade.healths;
  readonly activeFilterCount = this.tenantsFacade.activeFilterCount;
  readonly filteredTenants = this.tenantsFacade.filteredTenants;
  readonly filtersSearchQuery = signal('');
  readonly filteredStatuses = computed(() => this.filterPanelOptions(this.statuses));
  readonly filteredPlans = computed(() => this.filterPanelOptions(this.plans));
  readonly filteredHealths = computed(() => this.filterPanelOptions(this.healths));

  toggleFilter(type: 'status' | 'plan' | 'health', value: string): void {
    this.tenantsFacade.toggleFilter(type, value);
  }

  clearFilters(): void {
    this.tenantsFacade.clearFilters();
  }

  toggleFiltersDropdown(): void {
    const next = !this.showFiltersDropdown();
    this.showFiltersDropdown.set(next);
    if (!next) {
      this.filtersSearchQuery.set('');
    }
  }

  closeFiltersDropdown(): void {
    this.showFiltersDropdown.set(false);
    this.filtersSearchQuery.set('');
  }

  impersonate(tenant: Tenant) {
    // Save current URL to return back later
    this.dashboardService.returnUrl.set(this.router.url);

    // Navigate based on tenant type and update sidebar role
    if (tenant.tenantType === 'Individual Teacher') {
      this.dashboardService.setRole('teacher');
      this.router.navigate(['/teacher/overview']);
    } else {
      this.dashboardService.setRole('tenant');
      this.router.navigate(['/tenant/overview']);
    }
    console.log(`Impersonating tenant: ${tenant.name} (${tenant.tenantType})`);
  }

  requestStatusChange(tenant: Tenant, newStatus: string): void {
    this.tenantsFacade.requestStatusChange(tenant, newStatus);
  }

  confirmStatusChange(): void {
    this.tenantsFacade.confirmStatusChange();
  }

  cancelStatusChange(): void {
    this.tenantsFacade.cancelStatusChange();
  }

  requestPlanChange(tenant: Tenant, newPlan: string): void {
    this.tenantsFacade.requestPlanChange(tenant, newPlan);
  }

  confirmPlanChange(): void {
    this.tenantsFacade.confirmPlanChange();
  }

  cancelPlanChange(): void {
    this.tenantsFacade.cancelPlanChange();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copyNotification.set(text);
      setTimeout(() => {
        if (this.copyNotification() === text) {
          this.copyNotification.set(null);
        }
      }, 2000);
    });
  }

  private filterPanelOptions(options: readonly string[]): string[] {
    const query = this.filtersSearchQuery().trim().toLowerCase();
    if (!query) {
      return [...options];
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }
}
