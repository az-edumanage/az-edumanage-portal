import { Injectable, inject } from '@angular/core';
import { Invoice, Tab } from '../models/owner-billing.models';
import { OwnerBillingStore } from './owner-billing.store';
import { OwnerBillingService } from '../data-access/owner-billing.service';

@Injectable({ providedIn: 'root' })
export class OwnerBillingFacade {
  private readonly store = inject(OwnerBillingStore);
  private readonly billing = inject(OwnerBillingService);

  readonly activeTab = this.store.activeTab;
  readonly showAdvancedFilters = this.store.showAdvancedFilters;
  readonly showRefundModal = this.store.showRefundModal;
  readonly invoiceToRefund = this.store.invoiceToRefund;

  readonly tenantFilter = this.billing.tenantFilter;
  readonly searchQuery = this.billing.searchQuery;
  readonly filterStatus = this.billing.filterStatus;
  readonly filterMinAmount = this.billing.filterMinAmount;
  readonly filterMaxAmount = this.billing.filterMaxAmount;

  readonly loading = this.billing.loading;
  readonly loadError = this.billing.loadError;
  readonly isFiltered = this.billing.isFiltered;
  readonly maxRevenue = this.billing.maxRevenue;
  readonly monthlyReports = this.billing.monthlyReports;
  readonly invoices = this.billing.filteredInvoices;
  readonly filteredInvoices = this.billing.filteredInvoices;
  readonly filteredPayments = this.billing.filteredPayments;
  readonly filteredFailedPayments = this.billing.filteredFailedPayments;
  readonly filteredRefunds = this.billing.filteredRefunds;
  readonly manualPayPendingInvoiceId = this.billing.manualPayPendingInvoiceId;

  loadInvoices(): Promise<void> {
    return this.billing.loadInvoices();
  }

  setActiveTab(tab: Tab): void {
    this.store.setActiveTab(tab);
  }

  setShowAdvancedFilters(value: boolean): void {
    this.store.setShowAdvancedFilters(value);
  }

  toggleAdvancedFilters(): void {
    this.store.toggleAdvancedFilters();
  }

  setSearchQuery(query: string): void {
    this.billing.searchQuery.set(query);
  }

  setFilterStatus(status: string): void {
    this.billing.filterStatus.set(status);
  }

  setFilterMinAmount(value: number | null): void {
    this.billing.filterMinAmount.set(value);
  }

  setFilterMaxAmount(value: number | null): void {
    this.billing.filterMaxAmount.set(value);
  }

  clearTenantFilter(): void {
    this.billing.setTenantFilter(null);
  }

  setTenantFilter(tenantId: string | null): void {
    this.billing.setTenantFilter(tenantId);
  }

  resetFilters(): void {
    this.billing.resetFilters();
  }

  generateReport(): void {
    this.billing.generateReport();
  }

  manualPayInvoice(invoice: Invoice): Promise<void> {
    return this.billing.manualPayInvoice(invoice);
  }

  openRefund(invoice: Invoice): void {
    this.store.openRefund(invoice);
  }

  closeRefund(): void {
    this.store.closeRefund();
  }

  confirmRefund(): void {
    const invoice = this.store.invoiceToRefund();
    if (invoice) {
      this.billing.processRefund(invoice);
    }
    this.store.closeRefund();
  }

  copyToClipboard(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      console.log('Copied to clipboard:', value);
    });
  }
}
