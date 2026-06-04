import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TABLE_COMPONENTS } from '../../../../shared/directives';
import { Invoice } from '../../models/owner-billing.models';

@Component({
  selector: 'app-owner-billing-invoices-table',
  imports: [CommonModule, RouterModule, MatIconModule, ...TABLE_COMPONENTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-invoices-table.component.html',
  styleUrl: './owner-billing-invoices-table.component.css',
})
export class OwnerBillingInvoicesTableComponent {
  invoices = input.required<Invoice[]>();
  statusColorResolver = input<(status: string) => string>(() => '#64748b');
  manualPayPendingInvoiceId = input<string | null>(null);

  copyValue = output<string>();
  manualPay = output<Invoice>();
  initiateRefund = output<Invoice>();

  invoiceNumber(invoice: Invoice): string {
    return invoice.invoiceRef || invoice.id;
  }

  displayStatus(invoice: Invoice): string {
    return invoice.status || this.toLabel(invoice.invoiceStatus) || 'Unknown';
  }

  sourceLabel(invoice: Invoice): string {
    const source = invoice.source || invoice.invoiceSource;
    if (source === 'manual_admin_activation') {
      return 'Manual Activation';
    }
    if (source === 'payment_webhook') {
      return 'Payment Webhook';
    }
    if (source === 'scheduled_renewal' || source === 'recurring_scheduler') {
      return 'Scheduled Renewal';
    }
    return 'Invoice Source';
  }

  settlementLabel(invoice: Invoice): string | null {
    return this.toLabel(invoice.settlementStatus);
  }

  paymentSnapshotLabel(invoice: Invoice): string | null {
    return invoice.providerPaymentStatusSnapshot ?? null;
  }

  cycleLabel(invoice: Invoice): string {
    return this.toLabel(invoice.billingCycle) ?? '—';
  }

  periodLabel(invoice: Invoice): string {
    const start = invoice.billingPeriodStart || '—';
    const end = invoice.billingPeriodEnd || '—';
    return start === '—' && end === '—' ? '—' : `${start} - ${end}`;
  }

  paymentDate(invoice: Invoice): string {
    return invoice.paidAt || invoice.issueDate;
  }

  isOpen(invoice: Invoice): boolean {
    return invoice.invoiceStatus === 'open' || this.displayStatus(invoice) === 'Open';
  }

  isManualPayPending(invoice: Invoice): boolean {
    return this.manualPayPendingInvoiceId() === invoice.id;
  }

  private toLabel(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
