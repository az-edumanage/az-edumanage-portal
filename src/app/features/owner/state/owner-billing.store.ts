import { Injectable, signal } from '@angular/core';
import { Tab, Invoice } from '../models/owner-billing.models';

@Injectable({ providedIn: 'root' })
export class OwnerBillingStore {
  readonly activeTab = signal<Tab>('invoices');
  readonly showAdvancedFilters = signal(false);
  readonly showProofModal = signal(false);
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly showRefundModal = signal(false);
  readonly invoiceToRefund = signal<Invoice | null>(null);

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  setShowAdvancedFilters(value: boolean): void {
    this.showAdvancedFilters.set(value);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update((value) => !value);
  }

  openProof(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
    this.showProofModal.set(true);
  }

  closeProof(): void {
    this.showProofModal.set(false);
    this.selectedInvoice.set(null);
  }

  openRefund(invoice: Invoice): void {
    this.invoiceToRefund.set(invoice);
    this.showRefundModal.set(true);
  }

  closeRefund(): void {
    this.showRefundModal.set(false);
    this.invoiceToRefund.set(null);
  }
}
