import { Injectable, inject } from '@angular/core';
import { TenantBillingInvoiceCategory, TenantStudentInvoiceStatus } from '../models/tenant-billing.models';
import { TenantBillingStore } from './tenant-billing.store';

@Injectable({ providedIn: 'root' })
export class TenantBillingFacade {
  private readonly store = inject(TenantBillingStore);

  readonly invoices = this.store.invoices;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly actionMessage = this.store.actionMessage;
  readonly searchQuery = this.store.searchQuery;
  readonly statusFilter = this.store.statusFilter;
  readonly categoryFilter = this.store.categoryFilter;
  readonly summary = this.store.summary;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly totalItems = this.store.totalItems;
  readonly totalPages = this.store.totalPages;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly hasInvoices = this.store.hasInvoices;
  readonly payingInvoiceId = this.store.payingInvoiceId;

  loadInvoices(): void {
    this.store.loadInvoices();
  }

  setSearchQuery(value: string): void {
    this.store.setSearchQuery(value);
  }

  setStudentFilter(studentId: string, studentName = ''): void {
    this.store.setStudentFilter(studentId, studentName);
  }

  setStatusFilter(value: TenantStudentInvoiceStatus | ''): void {
    this.store.setStatusFilter(value);
  }

  setCategoryFilter(value: TenantBillingInvoiceCategory): void {
    this.store.setCategoryFilter(value);
  }

  nextPage(): void {
    this.store.setPageIndex(this.pageIndex() + 1);
  }

  previousPage(): void {
    this.store.setPageIndex(this.pageIndex() - 1);
  }

  setPageSize(value: number): void {
    this.store.setPageSize(value);
  }

  markPaid(invoiceId: string): void {
    this.store.markPaid(invoiceId);
  }
}
