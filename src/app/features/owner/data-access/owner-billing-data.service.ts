import { Injectable, inject } from '@angular/core';
import { OwnerBillingService } from '../owner-billing/services/owner-billing.service';
import { Invoice } from '../owner-billing/models/owner-billing.models';

@Injectable({ providedIn: 'root' })
export class OwnerBillingDataService {
  private readonly service = inject(OwnerBillingService);

  readonly tenantFilter = this.service.tenantFilter;
  readonly searchQuery = this.service.searchQuery;
  readonly filterStatus = this.service.filterStatus;
  readonly filterMinAmount = this.service.filterMinAmount;
  readonly filterMaxAmount = this.service.filterMaxAmount;

  readonly isFiltered = this.service.isFiltered;
  readonly maxRevenue = this.service.maxRevenue;

  readonly monthlyReports = this.service.monthlyReports;
  readonly filteredInvoices = this.service.filteredInvoices;
  readonly filteredPayments = this.service.filteredPayments;
  readonly filteredFailedPayments = this.service.filteredFailedPayments;
  readonly filteredRefunds = this.service.filteredRefunds;

  setTenantFilter(tenantId: string | null): void {
    this.service.setTenantFilter(tenantId);
  }

  resetFilters(): void {
    this.service.resetFilters();
  }

  generateReport(): void {
    this.service.generateReport();
  }

  confirmPayment(invoiceId: string): void {
    this.service.confirmPayment(invoiceId);
  }

  processRefund(invoice: Invoice): void {
    this.service.processRefund(invoice);
  }
}
