import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent, CardComponent } from '../../../../shared/ui';
import { TABLE_COMPONENTS } from '../../../../shared/directives';
import { OwnerBillingFacade } from '../../state/owner-billing.facade';
import { OwnerBillingStatusesDataService } from '../../data-access/owner-billing-statuses-data.service';
import { OwnerBillingFilterPanelComponent } from '../../components/owner-billing-filter-panel/owner-billing-filter-panel.component';
import { OwnerBillingInvoicesTableComponent } from '../../components/owner-billing-invoices-table/owner-billing-invoices-table.component';
import { OwnerBillingPaymentsTableComponent } from '../../components/owner-billing-payments-table/owner-billing-payments-table.component';

@Component({
  selector: 'app-owner-billing-page',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    ButtonComponent,
    CardComponent,
    OwnerBillingFilterPanelComponent,
    OwnerBillingInvoicesTableComponent,
    OwnerBillingPaymentsTableComponent,
    ...TABLE_COMPONENTS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-page.component.html',
  styleUrl: './owner-billing-page.component.css',
})
export class OwnerBillingPageComponent {
  private readonly facade = inject(OwnerBillingFacade);
  private readonly billingStatusesData = inject(OwnerBillingStatusesDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTab = this.facade.activeTab;
  readonly showAdvancedFilters = this.facade.showAdvancedFilters;
  readonly showProofModal = this.facade.showProofModal;
  readonly selectedInvoice = this.facade.selectedInvoice;
  readonly showRefundModal = this.facade.showRefundModal;
  readonly invoiceToRefund = this.facade.invoiceToRefund;

  readonly tenantFilter = this.facade.tenantFilter;
  readonly searchQuery = this.facade.searchQuery;
  readonly filterStatus = this.facade.filterStatus;
  readonly filterMinAmount = this.facade.filterMinAmount;
  readonly filterMaxAmount = this.facade.filterMaxAmount;

  readonly isFiltered = this.facade.isFiltered;
  readonly maxRevenue = this.facade.maxRevenue;
  readonly monthlyReports = this.facade.monthlyReports;
  readonly filteredInvoices = this.facade.filteredInvoices;
  readonly filteredPayments = this.facade.filteredPayments;
  readonly filteredFailedPayments = this.facade.filteredFailedPayments;
  readonly filteredRefunds = this.facade.filteredRefunds;
  readonly billingStatusOptions = this.billingStatusesData.statusNames;

  constructor() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['tenant']) {
          this.facade.setTenantFilter(params['tenant']);
        }
      });
  }

  setActiveTab(tab: 'invoices' | 'payments' | 'failed' | 'refunds' | 'settings' | 'reports'): void {
    this.facade.setActiveTab(tab);
  }

  setShowAdvancedFilters(value: boolean): void {
    this.facade.setShowAdvancedFilters(value);
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  setFilterStatus(value: string): void {
    this.facade.setFilterStatus(value);
  }

  setFilterMinAmount(value: number | null): void {
    this.facade.setFilterMinAmount(value);
  }

  setFilterMaxAmount(value: number | null): void {
    this.facade.setFilterMaxAmount(value);
  }

  resetFilters(): void {
    this.facade.resetFilters();
  }

  clearTenantFilter(): void {
    this.facade.clearTenantFilter();
  }

  generateReport(): void {
    this.facade.generateReport();
  }

  copyToClipboard(value: string): void {
    this.facade.copyToClipboard(value);
  }

  viewProof(invoice: Parameters<OwnerBillingFacade['openProof']>[0]): void {
    this.facade.openProof(invoice);
  }

  confirmPayment(): void {
    this.facade.confirmPayment();
  }

  rejectProof(): void {
    this.facade.rejectProof();
  }

  initiateRefund(invoice: Parameters<OwnerBillingFacade['openRefund']>[0]): void {
    this.facade.openRefund(invoice);
  }

  confirmRefund(): void {
    this.facade.confirmRefund();
  }

  closeRefundModal(): void {
    this.facade.closeRefund();
  }

  closeProofModal(): void {
    this.facade.closeProof();
  }

  getInvoiceStatusColor(status: string): string {
    return this.billingStatusesData.findByName(status)?.color ?? '#64748b';
  }
}
