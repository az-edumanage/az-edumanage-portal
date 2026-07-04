import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantBillingDataService } from '../data-access/tenant-billing-data.service';
import {
  TenantBillingInvoiceCategory,
  TenantBillingInvoiceSummary,
  TenantStudentInvoice,
  TenantStudentInvoiceStatus,
} from '../models/tenant-billing.models';

const EMPTY_SUMMARY: TenantBillingInvoiceSummary = {
  totalInvoices: 0,
  paidInvoices: 0,
  unpaidInvoices: 0,
  overdueInvoices: 0,
};

@Injectable({ providedIn: 'root' })
export class TenantBillingStore {
  private readonly data = inject(TenantBillingDataService);

  readonly invoices = signal<TenantStudentInvoice[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly studentIdFilter = signal('');
  readonly statusFilter = signal<TenantStudentInvoiceStatus | ''>('');
  readonly categoryFilter = signal<TenantBillingInvoiceCategory>('all');
  readonly summary = signal<TenantBillingInvoiceSummary>(EMPTY_SUMMARY);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(25);
  readonly totalItems = signal(0);
  readonly payingInvoiceId = signal<string | null>(null);

  readonly hasInvoices = computed(() => this.invoices().length > 0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly pageStart = computed(() => {
    if (this.totalItems() === 0) {
      return 0;
    }
    return this.pageIndex() * this.pageSize() + 1;
  });
  readonly pageEnd = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalItems()));

  loadInvoices(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.data.listTenantStudentInvoices({
      search: this.searchQuery(),
      studentId: this.studentIdFilter(),
      status: this.statusFilter(),
      category: this.categoryFilter(),
      page: this.pageIndex(),
      size: this.pageSize(),
    }).subscribe({
      next: (response) => {
        this.invoices.set(response.items ?? []);
        this.totalItems.set(response.totalItems ?? 0);
        this.summary.set(response.summary ?? EMPTY_SUMMARY);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.invoices.set([]);
        this.totalItems.set(0);
        this.summary.set(EMPTY_SUMMARY);
        this.isLoading.set(false);
      },
    });
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.studentIdFilter.set('');
    this.pageIndex.set(0);
    this.loadInvoices();
  }

  setStudentFilter(studentId: string, studentName = ''): void {
    this.studentIdFilter.set(studentId.trim());
    this.searchQuery.set(studentName.trim());
    this.pageIndex.set(0);
  }

  setStatusFilter(value: TenantStudentInvoiceStatus | ''): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadInvoices();
  }

  setCategoryFilter(value: TenantBillingInvoiceCategory): void {
    this.categoryFilter.set(value || 'all');
    this.pageIndex.set(0);
    this.loadInvoices();
  }

  setPageIndex(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 0;
    this.pageIndex.set(Math.max(0, Math.min(next, this.totalPages() - 1)));
    this.loadInvoices();
  }

  setPageSize(value: number): void {
    const next = Number.isFinite(value) ? Math.trunc(value) : 25;
    this.pageSize.set(Math.max(1, next));
    this.pageIndex.set(0);
    this.loadInvoices();
  }

  markPaid(invoiceId: string): void {
    if (this.payingInvoiceId()) {
      return;
    }
    this.payingInvoiceId.set(invoiceId);
    this.actionMessage.set(null);
    this.data.markTenantStudentInvoicePaid(invoiceId).subscribe({
      next: () => {
        this.payingInvoiceId.set(null);
        this.actionMessage.set('Invoice marked as paid.');
        this.loadInvoices();
      },
      error: (error: Error) => {
        this.payingInvoiceId.set(null);
        this.actionMessage.set(error.message || 'Unable to mark invoice paid');
      },
    });
  }
}
