import { Injectable, computed, inject, signal } from '@angular/core';
import { Invoice, Payment, Refund, MonthlyReport } from '../models/owner-billing.models';
import { OwnerBillingDataService } from './owner-billing-data.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerBillingService {
  private readonly data = inject(OwnerBillingDataService);
  private readonly allInvoices = signal<Invoice[]>([]);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly page = signal(0);
  readonly size = signal(100);
  readonly totalItems = signal(0);

  readonly monthlyReports = signal<MonthlyReport[]>([]);
  readonly manualPayPendingInvoiceId = signal<string | null>(null);

  tenantFilter = signal<string | null>(null);
  searchQuery = signal<string>('');
  filterStatus = signal<string>('All');
  filterDateStart = signal<string>('');
  filterDateEnd = signal<string>('');
  filterMinAmount = signal<number | null>(null);
  filterMaxAmount = signal<number | null>(null);

  readonly maxRevenue = computed(() => {
    const values = this.monthlyReports().map((report) => report.netRevenue);
    return values.length > 0 ? Math.max(...values) : 0;
  });

  readonly isFiltered = computed(() => {
    return this.searchQuery() !== '' ||
           this.tenantFilter() !== null ||
           this.filterStatus() !== 'All' ||
           this.filterMinAmount() !== null ||
           this.filterMaxAmount() !== null;
  });

  readonly filteredInvoices = computed(() => {
    let results = this.allInvoices();
    const tenant = this.tenantFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.filterStatus();
    const min = this.filterMinAmount();
    const max = this.filterMaxAmount();

    if (tenant) {
      results = results.filter((invoice) => invoice.tenantId === tenant || invoice.tenant.toLowerCase().includes(tenant.toLowerCase()));
    }
    if (query) {
      results = results.filter((invoice) =>
        (invoice.invoiceRef ?? invoice.id).toLowerCase().includes(query) ||
        invoice.tenant.toLowerCase().includes(query) ||
        invoice.plan.toLowerCase().includes(query) ||
        (invoice.paymentTransactionRef ?? '').toLowerCase().includes(query) ||
        (invoice.manualInvoiceRef ?? '').toLowerCase().includes(query)
      );
    }
    if (status !== 'All') {
      results = results.filter((invoice) => invoice.status === status);
    }
    if (min !== null) {
      results = results.filter((invoice) => invoice.amount >= min);
    }
    if (max !== null) {
      results = results.filter((invoice) => invoice.amount <= max);
    }
    return results;
  });

  readonly filteredPayments = computed(() => {
    return this.filteredInvoices()
      .filter((invoice) => invoice.paymentTransactionRef || invoice.providerPaymentStatusSnapshot)
      .map((invoice) => this.toPayment(invoice));
  });

  readonly filteredFailedPayments = computed(() => {
    return this.filteredInvoices()
      .filter((invoice) => invoice.invoiceStatus === 'overdue' || invoice.settlementStatus === 'failed')
      .map((invoice) => ({
        id: invoice.paymentTransactionRef || invoice.invoiceRef || invoice.id,
        tenant: invoice.tenant,
        amount: invoice.amount,
        reason: invoice.providerPaymentStatusSnapshot === 'failed' ? 'Payment failed' : 'Invoice overdue',
        retryCount: 0,
        lastAttempt: invoice.issueDate,
        gracePeriodEnd: invoice.graceUntil ? this.toDateLabel(invoice.graceUntil) : invoice.dueDate,
      }));
  });

  readonly filteredRefunds = signal<Refund[]>([]);

  async loadInvoices(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const response = await this.data.listInvoices({ page: 0, size: 200 });
      this.allInvoices.set(response.items);
      this.page.set(response.page ?? 0);
      this.size.set(response.size ?? response.items.length);
      this.totalItems.set(response.totalItems ?? response.items.length);
    } catch {
      this.allInvoices.set([]);
      this.loadError.set('Billing invoices could not be loaded right now.');
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters(): void {
    this.filterStatus.set('All');
    this.filterMinAmount.set(null);
    this.filterMaxAmount.set(null);
    this.filterDateStart.set('');
    this.filterDateEnd.set('');
    this.searchQuery.set('');
    this.tenantFilter.set(null);
  }

  setTenantFilter(tenantId: string | null): void {
    this.tenantFilter.set(tenantId);
  }

  async manualPayInvoice(invoice: Invoice): Promise<void> {
    if (this.manualPayPendingInvoiceId() === invoice.id) {
      return;
    }

    this.manualPayPendingInvoiceId.set(invoice.id);
    this.loadError.set(null);
    try {
      const updatedInvoice = await this.data.manualPayInvoice(invoice.id);
      this.allInvoices.update((invoices) => invoices.map((current) =>
        current.id === updatedInvoice.id ? updatedInvoice : current,
      ));
    } catch {
      this.loadError.set("Invoice could not be manually paid right now.");
    } finally {
      this.manualPayPendingInvoiceId.set(null);
    }
  }

  processRefund(invoice: Invoice): void {
    void invoice;
    this.loadError.set('Refund processing is not available from this billing view yet.');
  }

  generateReport(): void {
    console.log('Generating latest financial report...');
  }

  private toPayment(invoice: Invoice): Payment {
    const status = invoice.providerPaymentStatusSnapshot === 'failed'
      ? 'Failed'
      : invoice.providerPaymentStatusSnapshot === 'pending'
        ? 'Pending'
        : 'Success';

    return {
      id: invoice.paymentTransactionRef || invoice.invoiceRef || invoice.id,
      tenant: invoice.tenant,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      method: invoice.source === 'manual_admin_activation' ? 'Bank Transfer' : 'Card',
      status,
      date: invoice.paidAt ? this.toDateLabel(invoice.paidAt) : invoice.issueDate,
      ref: invoice.paymentTransactionRef || invoice.manualInvoiceRef || invoice.invoiceRef || invoice.id,
    };
  }

  private toDateLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
