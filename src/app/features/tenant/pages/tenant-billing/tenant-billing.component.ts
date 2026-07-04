import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import {
  TenantBillingInvoiceCategory,
  TenantStudentInvoice,
  TenantStudentInvoiceStatus,
} from '../../models/tenant-billing.models';
import { TenantBillingFacade } from '../../state/tenant-billing.facade';

@Component({
  selector: 'app-tenant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tenant-billing.component.html',
  styleUrl: './tenant-billing.component.css',
})
export class TenantBillingComponent {
  private readonly facade = inject(TenantBillingFacade);
  private readonly permissions = inject(TenantPermissionService);
  private readonly route = inject(ActivatedRoute);

  readonly invoices = this.facade.invoices;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly actionMessage = this.facade.actionMessage;
  readonly searchQuery = this.facade.searchQuery;
  readonly statusFilter = this.facade.statusFilter;
  readonly categoryFilter = this.facade.categoryFilter;
  readonly summary = this.facade.summary;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly totalItems = this.facade.totalItems;
  readonly totalPages = this.facade.totalPages;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly hasInvoices = this.facade.hasInvoices;
  readonly payingInvoiceId = this.facade.payingInvoiceId;
  readonly canMarkPaid = this.permissions.hasPermission('tenant.billing.markPaid');
  readonly billingCards: Array<{
    category: TenantBillingInvoiceCategory;
    label: string;
    icon: string;
    key: 'totalInvoices' | 'paidInvoices' | 'unpaidInvoices' | 'overdueInvoices';
  }> = [
    { category: 'all', label: 'Total Invoices', icon: 'receipt_long', key: 'totalInvoices' },
    { category: 'paid', label: 'Paid Invoices', icon: 'task_alt', key: 'paidInvoices' },
    { category: 'unpaid', label: 'Unpaid Invoices', icon: 'pending_actions', key: 'unpaidInvoices' },
    { category: 'overdue', label: 'Overdue Invoices', icon: 'report', key: 'overdueInvoices' },
  ];

  constructor() {
    const studentId = this.route.snapshot.queryParamMap.get('studentId')?.trim() ?? '';
    const studentName = this.route.snapshot.queryParamMap.get('studentName')?.trim() ?? '';
    if (studentId) {
      this.facade.setStudentFilter(studentId, studentName);
    }
    this.facade.loadInvoices();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  setStatusFilter(value: string): void {
    this.facade.setStatusFilter(value as TenantStudentInvoiceStatus | '');
  }

  setCategoryFilter(value: TenantBillingInvoiceCategory): void {
    this.facade.setCategoryFilter(value);
  }

  summaryValue(key: 'totalInvoices' | 'paidInvoices' | 'unpaidInvoices' | 'overdueInvoices'): number {
    return this.summary()[key] ?? 0;
  }

  setPageSize(value: string): void {
    this.facade.setPageSize(Number(value));
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  markPaid(invoice: TenantStudentInvoice): void {
    if (invoice.status === 'paid') {
      return;
    }
    this.facade.markPaid(invoice.id);
  }

  statusLabel(status: TenantStudentInvoiceStatus): string {
    return status === 'paid' ? 'Paid' : 'Unpaid';
  }

  amountLabel(invoice: TenantStudentInvoice): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: invoice.currency || 'EGP',
      maximumFractionDigits: 2,
    }).format(invoice.amount ?? 0);
  }

  durationLabel(invoice: TenantStudentInvoice): string {
    const unit = (invoice.durationType || '').toLowerCase();
    const value = invoice.durationValue || 0;
    const label = value === 1 ? unit : `${unit}s`;
    return `${invoice.paymentMethodName} · ${value} ${label}`;
  }

  dateLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}
