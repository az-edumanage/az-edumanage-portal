import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Invoice,
  OwnerBillingInvoiceListResponse,
  OwnerBillingInvoiceQuery,
} from '../models/owner-billing.models';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

interface BackendOwnerInvoice {
  id: string;
  invoiceRef?: string | null;
  tenantId: string;
  tenantName?: string | null;
  planId?: string | null;
  planName?: string | null;
  invoiceType?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  graceUntil?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  billingCycle?: string | null;
  subscriptionCycleId?: number | null;
  amount?: number | null;
  currency?: string | null;
  providerPaymentStatusSnapshot?: string | null;
  settlementStatus?: string | null;
  invoiceStatus?: string | null;
  source?: string | null;
  invoiceSource?: string | null;
  paidAt?: string | null;
  paymentTransactionId?: string | null;
  paymentTransactionRef?: string | null;
  manualSettlementId?: string | null;
  manualInvoiceRef?: string | null;
  createdBy?: string | null;
  manualActivationReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface BackendOwnerInvoiceListResponse {
  items?: BackendOwnerInvoice[];
  page?: number;
  size?: number;
  totalItems?: number;
}

@Injectable({ providedIn: 'root' })
export class OwnerBillingDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  async listInvoices(query: OwnerBillingInvoiceQuery = {}): Promise<OwnerBillingInvoiceListResponse> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.get<BackendOwnerInvoiceListResponse>(`${environment.apiBaseUrl}/owner/billing/invoices`, {
        params: this.toHttpParams(query),
      }),
    );

    return {
      items: (response.items ?? []).map((row) => this.mapInvoice(row)),
      page: response.page ?? query.page ?? 0,
      size: response.size ?? query.size,
      totalItems: response.totalItems ?? response.items?.length ?? 0,
    };
  }

  async manualPayInvoice(invoiceId: string): Promise<Invoice> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.post<BackendOwnerInvoice>(`${environment.apiBaseUrl}/owner/billing/invoices/${invoiceId}/manual-pay`, null),
    );

    return this.mapInvoice(response);
  }

  private toHttpParams(query: OwnerBillingInvoiceQuery): HttpParams {
    let params = new HttpParams();
    const entries: [string, string | number | null | undefined][] = [
      ['page', query.page],
      ['size', query.size],
      ['tenantId', query.tenantId],
      ['status', query.status],
      ['invoiceStatus', query.invoiceStatus],
      ['settlementStatus', query.settlementStatus],
      ['invoiceType', query.invoiceType],
      ['source', query.source],
      ['search', query.search],
    ];

    for (const [key, value] of entries) {
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    }

    return params;
  }

  private mapInvoice(row: BackendOwnerInvoice): Invoice {
    const invoiceStatus = this.normalize(row.invoiceStatus);
    const settlementStatus = this.normalize(row.settlementStatus);
    const source = this.resolveSource(row);
    const invoiceRef = row.invoiceRef?.trim() || row.id;
    const tenantName = row.tenantName?.trim() || 'N/A';
    const planName = row.planName?.trim() || 'N/A';

    return {
      id: row.id,
      invoiceRef,
      tenant: tenantName,
      tenantId: row.tenantId,
      tenantName,
      plan: planName,
      planId: row.planId ?? undefined,
      planName,
      amount: Number(row.amount ?? 0),
      issueDate: this.toDateLabel(row.issueDate ?? row.createdAt),
      dueDate: this.toDateLabel(row.dueDate),
      status: this.toDisplayStatus(invoiceStatus),
      invoiceType: this.normalize(row.invoiceType) ?? undefined,
      currency: row.currency ?? 'EGP',
      providerPaymentStatusSnapshot: this.normalize(row.providerPaymentStatusSnapshot),
      settlementStatus: settlementStatus ?? undefined,
      invoiceStatus: invoiceStatus ?? undefined,
      source,
      invoiceSource: source,
      paidAt: row.paidAt ?? null,
      paymentTransactionId: row.paymentTransactionId ?? null,
      paymentTransactionRef: row.paymentTransactionRef ?? null,
      manualSettlementId: row.manualSettlementId ?? null,
      manualInvoiceRef: row.manualInvoiceRef ?? null,
      createdBy: row.createdBy ?? null,
      manualActivationReason: row.manualActivationReason ?? null,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
      billingPeriodStart: row.billingPeriodStart ?? undefined,
      billingPeriodEnd: row.billingPeriodEnd ?? undefined,
      billingCycle: this.normalize(row.billingCycle),
      subscriptionCycleId: row.subscriptionCycleId ?? null,
      graceUntil: row.graceUntil ?? null,
    };
  }


  private resolveSource(row: BackendOwnerInvoice): string | null {
    const explicit = this.normalize(row.source ?? row.invoiceSource);
    if (explicit) {
      return explicit;
    }
    if (row.manualSettlementId) {
      return 'manual_admin_activation';
    }
    if (row.paymentTransactionId) {
      return 'payment_webhook';
    }
    return null;
  }

  private normalize(value: string | null | undefined): string | null {
    const normalized = value?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  private toDisplayStatus(status: string | null): string {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'open':
        return 'Open';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unpaid';
    }
  }

  private toDateLabel(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

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
