import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ManualSettlementRequest,
  ManualSettlementResult,
  ManualSettlementSummary,
  ManualTenantLifecycleStatusChangeRequest,
  OwnerDisplayStatus,
  ProviderPaymentStatus,
  SettlementStatus,
  SubscriptionState,
  Tenant,
  TenantCreatedBy,
  TenantLifecycleBillingSideEffectSummary,
  TenantLifecycleStatusChangeResult,
  TenantLifecycleAuditSummary,
  TenantOperationalStatus,
  TenantSubscriptionType,
  TenantStatus,
} from '../models/owner-tenants.models';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

interface BackendTenantResponse {
  id: string;
  centerName: string;
  tenantType: string;
  subdomain: string;
  domain: string;
  industry: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  planName: string;
  isTrial: boolean;
  subscriptionState?: string | null;
  subscriptionType?: string | null;
  createdBy?: string | null;
  provisioningTriggeredBy?: string | null;
  providerPaymentStatus?: string | null;
  tenantOperationalStatus?: string | null;
  settlementStatus?: string | null;
  ownerDisplayStatus?: string | null;
  createdAt: string;
}

interface BackendManualSettlementResponse {
  tenant: BackendTenantResponse;
  manualSettlement: {
    id: string;
    tenantId: string;
    paymentTransactionRef: string | null;
    manualInvoiceRef: string;
    manualPaymentRef: string;
    amount: number;
    currency: string;
    settledAt: string;
    evidenceRef: string | null;
    evidenceNote: string | null;
    note: string | null;
    settledBy: string;
    status: string;
  };
}

interface BackendLifecycleStatusChangeResponse {
  tenant: BackendTenantResponse;
  billingSideEffect: {
    happened: boolean;
    type: 'none' | 'invoice_created_and_manually_settled' | 'existing_invoice_manually_settled';
    invoiceId: string | null;
    invoiceRef: string | null;
    manualSettlementId: string | null;
    manualSettlementRef: string | null;
    paymentTransactionId: string | null;
  };
  audit: {
    id: string;
    source: 'OWNER_MANUAL';
    outcome: 'success' | 'rejected' | 'failed';
    previousStatus: 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked';
    requestedTargetStatus: 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked';
    finalStatus: 'pending' | 'active' | 'suspended' | 'disabled' | 'blocked' | null;
    actorUsername: string | null;
    reason: string;
    billingSideEffect: boolean;
    failureReason: string | null;
    createdAt: string;
  };
}

@Injectable({ providedIn: 'root' })
export class OwnerTenantsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly tenants = signal<Tenant[]>([]);

  async loadFromBackend(): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const rows = await firstValueFrom(
      this.http.get<BackendTenantResponse[]>(`${environment.apiBaseUrl}/tenant-catalog/tenants`),
    );

    const mapped = (rows ?? []).map((row) => this.mapTenant(row));
    this.tenants.set(mapped);
  }

  updateTenantPlan(tenantId: string, plan: string): void {
    this.tenants.update((all) =>
      all.map((tenant) => (tenant.id === tenantId ? { ...tenant, plan } : tenant)),
    );
  }

  async recordManualSettlement(tenantId: string, payload: ManualSettlementRequest): Promise<ManualSettlementResult> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.post<BackendManualSettlementResponse>(
        `${environment.apiBaseUrl}/tenant-catalog/tenants/${tenantId}/manual-settlements`,
        this.toBackendManualSettlementRequest(payload),
      ),
    );

    const result: ManualSettlementResult = {
      tenant: this.mapTenant(response.tenant),
      manualSettlement: this.mapManualSettlement(response.manualSettlement),
    };

    this.tenants.update((all) =>
      all.map((tenant) => (tenant.id === tenantId ? result.tenant : tenant)),
    );

    return result;
  }

  async changeTenantLifecycleStatus(
    tenantId: string,
    payload: ManualTenantLifecycleStatusChangeRequest,
  ): Promise<TenantLifecycleStatusChangeResult> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.patch<BackendLifecycleStatusChangeResponse>(
        `${environment.apiBaseUrl}/owner/tenants/${tenantId}/lifecycle-status`,
        this.toBackendLifecycleStatusChangeRequest(payload),
      ),
    );

    const result: TenantLifecycleStatusChangeResult = {
      tenant: this.mapTenant(response.tenant),
      billingSideEffect: this.mapLifecycleBillingSideEffect(response.billingSideEffect),
      audit: this.mapLifecycleAudit(response.audit),
    };

    this.tenants.update((all) =>
      all.map((tenant) => (tenant.id === tenantId ? result.tenant : tenant)),
    );

    return result;
  }

  addTrialTenant(payload: {
    name: string;
    fullName: string;
    phoneNumber: string;
    ownerEmail: string;
    plan?: string;
  }): Tenant {
    const tenant: Tenant = {
      id: `temp_${Date.now()}`,
      name: payload.name.trim(),
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      status: 'Pending',
      ownerDisplayStatus: 'pending',
      providerPaymentStatus: 'unknown',
      tenantOperationalStatus: 'pending',
      settlementStatus: 'unknown',
      plan: payload.plan?.trim() || 'Trial Plan',
      createdDate: this.toDateLabel(new Date().toISOString()),
      ownerEmail: payload.ownerEmail.trim().toLowerCase(),
      healthStatus: 'Healthy',
      tenantType: 'center',
      subscriptionState: 'trial',
      subscriptionType: 'trial',
      createdBy: 'system',
    };
    this.tenants.update((all) => [tenant, ...all]);
    return tenant;
  }

  private mapTenant(row: BackendTenantResponse): Tenant {
    const normalizedType = (row.tenantType || '').toLowerCase();
    const tenantType = normalizedType.includes('teacher') ? 'teacher' : 'center';
    const providerPaymentStatus = this.normalizeProviderPaymentStatus(row.providerPaymentStatus);
    const subscriptionState = this.normalizeSubscriptionState(row.subscriptionState);
    const subscriptionType = this.normalizeSubscriptionType(row.subscriptionType, row.isTrial);
    const tenantOperationalStatus = this.normalizeTenantOperationalStatus(row.tenantOperationalStatus);
    const settlementStatus = this.normalizeSettlementStatus(row.settlementStatus);
    const ownerDisplayStatus = this.normalizeOwnerDisplayStatus(row.ownerDisplayStatus);
    const status = this.resolveTenantStatus(tenantOperationalStatus, ownerDisplayStatus);
    return {
      id: row.id,
      name: row.centerName || 'N/A',
      fullName: row.contactName?.trim() || 'N/A',
      phoneNumber: row.contactPhone?.trim() || 'N/A',
      status: this.toDisplayStatus(status),
      ownerDisplayStatus,
      providerPaymentStatus,
      tenantOperationalStatus,
      settlementStatus,
      plan: row.planName || 'N/A',
      createdDate: this.toDateLabel(row.createdAt),
      ownerEmail: row.contactEmail?.trim() || 'N/A',
      healthStatus: 'Healthy',
      tenantType,
      subscriptionState,
      subscriptionType,
      createdBy: this.normalizeCreatedBy(row.createdBy, row.provisioningTriggeredBy),
    };
  }

  private mapManualSettlement(row: BackendManualSettlementResponse['manualSettlement']): ManualSettlementSummary {
    return {
      id: row.id,
      tenantId: row.tenantId,
      paymentTransactionRef: row.paymentTransactionRef,
      manualInvoiceRef: row.manualInvoiceRef,
      manualPaymentRef: row.manualPaymentRef,
      amount: row.amount,
      currency: row.currency,
      settledAt: row.settledAt,
      evidenceRef: row.evidenceRef,
      evidenceNote: row.evidenceNote,
      note: row.note,
      settledBy: row.settledBy,
      status: row.status,
    };
  }

  private toBackendManualSettlementRequest(payload: ManualSettlementRequest): ManualSettlementRequest {
    return {
      paymentTransactionRef: this.normalizeOptionalText(payload.paymentTransactionRef),
      manualInvoiceRef: payload.manualInvoiceRef.trim(),
      manualPaymentRef: payload.manualPaymentRef.trim(),
      amount: payload.amount,
      currency: payload.currency.trim(),
      settledAt: payload.settledAt,
      evidenceRef: this.normalizeOptionalText(payload.evidenceRef),
      evidenceNote: this.normalizeOptionalText(payload.evidenceNote),
      note: this.normalizeOptionalText(payload.note),
    };
  }

  private toBackendLifecycleStatusChangeRequest(
    payload: ManualTenantLifecycleStatusChangeRequest,
  ): ManualTenantLifecycleStatusChangeRequest {
    return {
      targetStatus: payload.targetStatus,
      reason: payload.reason.trim(),
    };
  }

  private mapLifecycleBillingSideEffect(
    row: BackendLifecycleStatusChangeResponse['billingSideEffect'],
  ): TenantLifecycleBillingSideEffectSummary {
    return {
      happened: row.happened,
      type: row.type,
      invoiceId: row.invoiceId,
      invoiceRef: row.invoiceRef,
      manualSettlementId: row.manualSettlementId,
      manualSettlementRef: row.manualSettlementRef,
      paymentTransactionId: row.paymentTransactionId,
    };
  }

  private mapLifecycleAudit(
    row: BackendLifecycleStatusChangeResponse['audit'],
  ): TenantLifecycleAuditSummary {
    return {
      id: row.id,
      source: row.source,
      outcome: row.outcome,
      previousStatus: row.previousStatus,
      requestedTargetStatus: row.requestedTargetStatus,
      finalStatus: row.finalStatus,
      actorUsername: row.actorUsername,
      reason: row.reason,
      billingSideEffect: row.billingSideEffect,
      failureReason: row.failureReason,
      createdAt: row.createdAt,
    };
  }

  private normalizeSubscriptionState(raw: string | null | undefined): SubscriptionState {
    const normalized = String(raw ?? '').trim().toLowerCase();
    if (normalized === 'pending_payment') {
      return 'pending_payment';
    }
    if (normalized === 'production') {
      return 'production';
    }
    if (normalized === 'trial') {
      return 'trial';
    }
    if (normalized === 'expired') {
      return 'expired';
    }
    if (normalized === 'cancelled') {
      return 'cancelled';
    }
    return 'unknown';
  }

  private normalizeSubscriptionType(
    raw: string | null | undefined,
    isTrial: boolean,
  ): TenantSubscriptionType {
    const normalized = String(raw ?? '').trim().toLowerCase();
    if (normalized === 'trial') {
      return 'trial';
    }
    if (normalized === 'production') {
      return 'production';
    }
    return isTrial ? 'trial' : 'production';
  }

  private normalizeCreatedBy(
    createdByRaw: string | null | undefined,
    triggeredByRaw: string | null | undefined,
  ): TenantCreatedBy {
    const createdBy = String(createdByRaw ?? '').trim().toLowerCase();
    if (createdBy === 'admin' || createdBy === 'system') {
      return createdBy;
    }
    const triggeredBy = String(triggeredByRaw ?? '').trim().toLowerCase();
    return triggeredBy === 'admin' ? 'admin' : 'system';
  }

  private normalizeProviderPaymentStatus(value: string | null | undefined): ProviderPaymentStatus {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'paid') {
      return 'paid';
    }
    if (normalized === 'failed') {
      return 'failed';
    }
    if (normalized === 'cancelled') {
      return 'cancelled';
    }
    if (normalized === 'expired') {
      return 'expired';
    }
    if (normalized === 'pending') {
      return 'pending';
    }
    return 'unknown';
  }

  private normalizeTenantOperationalStatus(value: string | null | undefined): TenantOperationalStatus {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'active') {
      return 'active';
    }
    if (normalized === 'suspended') {
      return 'suspended';
    }
    if (normalized === 'disabled') {
      return 'disabled';
    }
    if (normalized === 'blocked') {
      return 'blocked';
    }
    if (normalized === 'pending') {
      return 'pending';
    }
    return 'unknown';
  }

  private normalizeSettlementStatus(value: string | null | undefined): SettlementStatus {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'provider_paid') {
      return 'provider_paid';
    }
    if (normalized === 'manual_paid') {
      return 'manual_paid';
    }
    if (normalized === 'unpaid') {
      return 'unpaid';
    }
    if (normalized === 'failed') {
      return 'failed';
    }
    return 'unknown';
  }

  private normalizeOwnerDisplayStatus(value: string | null | undefined): OwnerDisplayStatus {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'active') {
      return 'active';
    }
    if (normalized === 'suspended') {
      return 'suspended';
    }
    if (normalized === 'disabled') {
      return 'disabled';
    }
    if (normalized === 'blocked') {
      return 'blocked';
    }
    if (normalized === 'pending') {
      return 'pending';
    }
    if (normalized === 'unknown') {
      return 'unknown';
    }
    return 'unknown';
  }

  private resolveTenantStatus(
    tenantOperationalStatus: TenantOperationalStatus,
    ownerDisplayStatus: OwnerDisplayStatus,
  ): OwnerDisplayStatus {
    if (tenantOperationalStatus !== 'unknown') {
      return tenantOperationalStatus;
    }
    return ownerDisplayStatus;
  }

  private toDisplayStatus(status: OwnerDisplayStatus): TenantStatus {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'disabled':
        return 'Disabled';
      case 'blocked':
        return 'Blocked';
      case 'unknown':
        return 'Unknown';
      default:
        return 'Pending';
    }
  }

  private toDateLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const normalized = String(value ?? '').trim();
    return normalized ? normalized : null;
  }
}
