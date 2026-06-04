import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable, switchMap, map } from 'rxjs';
import {
  OwnerTenantDetails,
  OwnerTenantDetailsApiResponse,
  OwnerTenantPlanOption,
  TenantBillingHistoryRow,
} from '../models/owner-tenant-details.models';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

const EMPTY_VALUE = '—';

interface TenantBillingInvoiceResponse {
  id?: string | null;
  invoiceRef?: string | null;
  invoiceNumber?: string | null;
  reference?: string | null;
  issueDate?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  currency?: string | null;
  invoiceStatus?: string | null;
  settlementStatus?: string | null;
  status?: string | null;
  downloadUrl?: string | null;
}

interface TenantBillingInvoiceListResponse {
  items?: TenantBillingInvoiceResponse[] | null;
}


@Injectable({ providedIn: 'root' })
export class OwnerTenantDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  getTenantById(id: string): Observable<OwnerTenantDetails> {
    return from(this.authApi.ensureLoggedIn()).pipe(
      switchMap(() =>
        this.http.get<OwnerTenantDetailsApiResponse>(
          environment.apiBaseUrl + '/tenant-catalog/tenants/' + encodeURIComponent(id),
        ),
      ),
      map((tenant) => this.mapTenantDetails(tenant)),
    );
  }

  getTenantBillingHistory(tenantId: string): Observable<TenantBillingHistoryRow[]> {
    const params = new HttpParams()
      .set('tenantId', tenantId)
      .set('page', '0')
      .set('size', '5');

    return from(this.authApi.ensureLoggedIn()).pipe(
      switchMap(() =>
        this.http.get<TenantBillingInvoiceListResponse>(
          environment.apiBaseUrl + '/owner/billing/invoices',
          { params },
        ),
      ),
      map((response) => (response.items ?? []).map((invoice, index) => this.mapBillingHistoryRow(invoice, index))),
    );
  }

  getPlanOptions(tenant: OwnerTenantDetails | null): OwnerTenantPlanOption[] {
    if (!tenant || tenant.planId === EMPTY_VALUE) {
      return [];
    }

    return [{ id: tenant.planId, name: tenant.planName, price: EMPTY_VALUE }];
  }

  getPlanPrice(planId: string | null): string {
    return planId ? EMPTY_VALUE : '';
  }

  getPlanName(planId: string | null, tenant: OwnerTenantDetails | null): string {
    if (!planId || !tenant || tenant.planId !== planId) {
      return '';
    }

    return tenant.planName;
  }

  private mapTenantDetails(row: OwnerTenantDetailsApiResponse): OwnerTenantDetails {
    const addressParts = [row.address, row.city, row.country]
      .map((value) => this.safeOptional(value))
      .filter((value) => value !== EMPTY_VALUE);
    const planId = this.safeOptional(row.planId);
    const planName = this.safeOptional(row.planName);

    return {
      id: row.id,
      centerName: this.safeOptional(row.centerName),
      tenantType: this.safeOptional(row.tenantType),
      subdomain: this.safeOptional(row.subdomain),
      domain: this.safeOptional(row.domain),
      industry: this.safeOptional(row.industry),
      contactName: this.safeOptional(row.contactName),
      contactEmail: this.safeOptional(row.contactEmail),
      contactPhone: this.safeOptional(row.contactPhone),
      address: this.safeOptional(row.address),
      city: this.safeOptional(row.city),
      country: this.safeOptional(row.country),
      planId,
      planName,
      isTrial: row.isTrial === true,
      trialDays: row.trialDays ?? 0,
      region: this.safeOptional(row.region),
      autoProvision: row.autoProvision === true,
      sendInvite: row.sendInvite === true,
      onboardingLink: row.onboardingLink === true,
      sendOnboardingWhatsapp: row.sendOnboardingWhatsapp === true,
      sendOnboardingEmail: row.sendOnboardingEmail === true,
      schemaName: this.safeOptional(row.schemaName),
      provisioningStatus: this.toDisplayLabel(row.provisioningStatus),
      provisioningError: this.safeOptional(row.provisioningError),
      isActive: row.isActive === true,
      tenantOperationalStatus: this.toDisplayLabel(row.tenantOperationalStatus),
      ownerDisplayStatus: this.toDisplayLabel(row.ownerDisplayStatus),
      subscriptionState: this.toDisplayLabel(row.subscriptionState),
      subscriptionType: this.toDisplayLabel(row.subscriptionType),
      subscriptionStartedAt: this.toDateLabel(row.subscriptionStartedAt),
      currentPeriodStartAt: this.toDateLabel(row.currentPeriodStartAt),
      currentPeriodEndAt: this.toDateLabel(row.currentPeriodEndAt),
      billingStatus: this.toDisplayLabel(row.billingStatus),
      openInvoice: this.mapOpenInvoice(row.openInvoice),
      providerPaymentStatus: this.toDisplayLabel(row.providerPaymentStatus),
      settlementStatus: this.toDisplayLabel(row.settlementStatus),
      createdBy: this.toDisplayLabel(row.createdBy),
      provisioningSource: this.toDisplayLabel(row.provisioningSource),
      provisioningTriggeredBy: this.safeOptional(row.provisioningTriggeredBy),
      status: this.resolveStatus(row.isActive, row.ownerDisplayStatus, row.tenantOperationalStatus),
      createdDate: this.toDateLabel(row.createdAt),
      updatedDate: this.toDateLabel(row.updatedAt),
      addressDisplay: addressParts.length ? addressParts.join(', ') : EMPTY_VALUE,
      tenantUrl: this.toTenantUrl(row.subdomain, row.domain),
      nextBillingDate: this.toDateLabel(row.nextBillingDate),
      usageStudents: EMPTY_VALUE,
      usageStudentsLimit: EMPTY_VALUE,
      usageStorage: EMPTY_VALUE,
      usageStorageLimit: EMPTY_VALUE,
      usageApiCalls: EMPTY_VALUE,
      usageApiCallsLimit: EMPTY_VALUE,
    };
  }


  private mapBillingHistoryRow(
    invoice: TenantBillingInvoiceResponse,
    index: number,
  ): TenantBillingHistoryRow {
    const id = this.safeOptional(invoice.id);
    const downloadUrl = this.safeOptional(invoice.downloadUrl);

    return {
      id: id === EMPTY_VALUE ? 'billing-history-' + index : id,
      invoice: this.firstPresent(invoice.invoiceRef, invoice.invoiceNumber, invoice.reference),
      date: this.toDateLabel(invoice.issueDate ?? invoice.createdAt ?? invoice.dueDate ?? null),
      amount: this.toAmountLabel(invoice.amount, invoice.currency),
      status: this.toDisplayLabel(invoice.invoiceStatus ?? invoice.settlementStatus ?? invoice.status),
      downloadUrl: downloadUrl === EMPTY_VALUE ? null : downloadUrl,
    };
  }

  private toAmountLabel(amount: number | null | undefined, currency: string | null | undefined): string {
    if (amount === null || amount === undefined || !Number.isFinite(amount)) {
      return EMPTY_VALUE;
    }

    const amountLabel = amount.toLocaleString('en-US');
    const currencyLabel = this.safeOptional(currency);
    return currencyLabel === EMPTY_VALUE ? amountLabel : amountLabel + ' ' + currencyLabel;
  }

  private firstPresent(...values: (string | null | undefined)[]): string {
    for (const value of values) {
      const safeValue = this.safeOptional(value);
      if (safeValue !== EMPTY_VALUE) {
        return safeValue;
      }
    }

    return EMPTY_VALUE;
  }

  private mapOpenInvoice(
    invoice: OwnerTenantDetailsApiResponse['openInvoice'],
  ): OwnerTenantDetails['openInvoice'] {
    if (!invoice) {
      return null;
    }

    const amount = Number(invoice.amount ?? 0);
    const currency = this.safeOptional(invoice.currency);

    return {
      id: invoice.id,
      invoiceRef: this.safeOptional(invoice.invoiceRef),
      amount: Number.isFinite(amount) ? amount.toLocaleString('en-US') : EMPTY_VALUE,
      currency,
      periodStartAt: this.toDateLabel(invoice.periodStartAt),
      periodEndAt: this.toDateLabel(invoice.periodEndAt),
      dueDate: this.toDateLabel(invoice.dueDate),
      status: this.toDisplayLabel(invoice.status),
    };
  }

  private resolveStatus(
    isActive: boolean | null,
    ownerDisplayStatus: string | null,
    tenantOperationalStatus: string | null,
  ): string {
    const ownerStatus = this.toDisplayLabel(ownerDisplayStatus);
    if (ownerStatus !== EMPTY_VALUE) {
      return ownerStatus;
    }

    const operationalStatus = this.toDisplayLabel(tenantOperationalStatus);
    if (operationalStatus !== EMPTY_VALUE) {
      return operationalStatus;
    }

    return isActive === true ? 'Active' : 'Inactive';
  }

  private toTenantUrl(subdomain: string | null, domain: string | null): string {
    const safeSubdomain = this.safeOptional(subdomain);
    const safeDomain = this.safeOptional(domain);

    if (safeSubdomain === EMPTY_VALUE && safeDomain === EMPTY_VALUE) {
      return EMPTY_VALUE;
    }
    if (safeSubdomain === EMPTY_VALUE) {
      return safeDomain;
    }
    if (safeDomain === EMPTY_VALUE) {
      return safeSubdomain;
    }

    return safeDomain.startsWith('.') ? safeSubdomain + safeDomain : safeSubdomain + '.' + safeDomain;
  }

  private toDateLabel(value: string | null): string {
    if (!value) {
      return EMPTY_VALUE;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return EMPTY_VALUE;
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private toDisplayLabel(value: string | null | undefined): string {
    const safeValue = this.safeOptional(value);
    if (safeValue === EMPTY_VALUE) {
      return EMPTY_VALUE;
    }

    return safeValue
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private safeOptional(value: string | null | undefined): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : EMPTY_VALUE;
  }
}
