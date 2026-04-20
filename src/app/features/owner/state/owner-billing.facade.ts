import { Injectable, inject } from '@angular/core';
import { Invoice, Tab } from '../models/owner-billing.models';
import { OwnerBillingStore } from './owner-billing.store';
import { OwnerBillingDataService } from '../data-access/owner-billing-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerBillingFacade {
  private readonly store = inject(OwnerBillingStore);
  private readonly data = inject(OwnerBillingDataService);

  readonly activeTab = this.store.activeTab;
  readonly showAdvancedFilters = this.store.showAdvancedFilters;
  readonly showProofModal = this.store.showProofModal;
  readonly selectedInvoice = this.store.selectedInvoice;
  readonly showRefundModal = this.store.showRefundModal;
  readonly invoiceToRefund = this.store.invoiceToRefund;

  readonly tenantFilter = this.data.tenantFilter;
  readonly searchQuery = this.data.searchQuery;
  readonly filterStatus = this.data.filterStatus;
  readonly filterMinAmount = this.data.filterMinAmount;
  readonly filterMaxAmount = this.data.filterMaxAmount;

  readonly isFiltered = this.data.isFiltered;
  readonly maxRevenue = this.data.maxRevenue;
  readonly monthlyReports = this.data.monthlyReports;
  readonly filteredInvoices = this.data.filteredInvoices;
  readonly filteredPayments = this.data.filteredPayments;
  readonly filteredFailedPayments = this.data.filteredFailedPayments;
  readonly filteredRefunds = this.data.filteredRefunds;

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
    this.data.searchQuery.set(query);
  }

  setFilterStatus(status: string): void {
    this.data.filterStatus.set(status);
  }

  setFilterMinAmount(value: number | null): void {
    this.data.filterMinAmount.set(value);
  }

  setFilterMaxAmount(value: number | null): void {
    this.data.filterMaxAmount.set(value);
  }

  clearTenantFilter(): void {
    this.data.setTenantFilter(null);
  }

  setTenantFilter(tenantId: string | null): void {
    this.data.setTenantFilter(tenantId);
  }

  resetFilters(): void {
    this.data.resetFilters();
  }

  generateReport(): void {
    this.data.generateReport();
  }

  openProof(invoice: Invoice): void {
    this.store.openProof(invoice);
  }

  closeProof(): void {
    this.store.closeProof();
  }

  confirmPayment(): void {
    const invoice = this.store.selectedInvoice();
    if (invoice) {
      this.data.confirmPayment(invoice.id);
    }
    this.store.closeProof();
  }

  rejectProof(): void {
    this.store.closeProof();
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
      this.data.processRefund(invoice);
    }
    this.store.closeRefund();
  }

  copyToClipboard(value: string): void {
    navigator.clipboard.writeText(value).then(() => {
      console.log('Copied to clipboard:', value);
    });
  }
}
