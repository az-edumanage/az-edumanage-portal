import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { OwnerTenantsListStore } from './owner-tenants-list.store';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import { Tenant, TenantLifecycleStatusChangeResult } from '../models/owner-tenants.models';

describe('OwnerTenantsListStore', () => {
  let store: OwnerTenantsListStore;
  let dataService: {
    tenants: WritableSignal<Tenant[]>;
    updateTenantPlan: (...args: unknown[]) => void;
    recordManualSettlement: ReturnType<typeof vi.fn>;
    changeTenantLifecycleStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    dataService = {
      tenants: signal<Tenant[]>([
        {
          id: 'tenant-1',
          name: 'Bright Center',
          fullName: 'Owner Name',
          phoneNumber: '01000000000',
          status: 'Pending',
          ownerDisplayStatus: 'pending',
          providerPaymentStatus: 'pending',
          tenantOperationalStatus: 'active',
          settlementStatus: 'unpaid',
          plan: 'Professional',
          createdDate: 'May 24, 2026',
          ownerEmail: 'owner@example.com',
          healthStatus: 'Healthy',
          tenantType: 'center',
          subscriptionState: 'production',
          subscriptionType: 'production',
          createdBy: 'system',
        },
      ]),
      updateTenantPlan: () => {},
      recordManualSettlement: vi.fn(),
      changeTenantLifecycleStatus: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: OwnerTenantsDataService, useValue: dataService }],
    });
    store = TestBed.inject(OwnerTenantsListStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes searchQuery and filteredTenants signals', () => {
    expect(store.searchQuery).toBeDefined();
    expect(typeof store.searchQuery).toBe('function');
    expect(store.filteredTenants).toBeDefined();
    expect(typeof store.filteredTenants).toBe('function');
  });

  it('updates pendingStatusChange when requestStatusChange is called', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    expect(store.pendingStatusChange()).not.toBeNull();
    expect(store.pendingStatusChange()?.tenant.id).toBe(target.id);
    expect(store.pendingStatusChange()?.status).toBe('Suspended');
  });

  it('clears pendingStatusChange after confirm', async () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    dataService.changeTenantLifecycleStatus.mockResolvedValue({
      tenant: {
        ...target,
        status: 'Suspended',
        ownerDisplayStatus: 'suspended',
        tenantOperationalStatus: 'suspended',
      },
      billingSideEffect: {
        happened: false,
        type: 'none',
        invoiceId: null,
        invoiceRef: null,
        manualSettlementId: null,
        manualSettlementRef: null,
        paymentTransactionId: null,
      },
      audit: {
        id: 'audit-1',
        source: 'OWNER_MANUAL',
        outcome: 'success',
        previousStatus: 'pending',
        requestedTargetStatus: 'suspended',
        finalStatus: 'suspended',
        failureReason: null,
        createdAt: '2026-05-24T10:30:00Z',
      },
    } as TenantLifecycleStatusChangeResult);
    store.requestStatusChange(target, 'Suspended');
    await store.confirmStatusChange();
    expect(store.pendingStatusChange()).toBeNull();
  });

  it('updates only the affected row after backend success', async () => {
    const target = store.filteredTenants()[0];
    const updatedTenant: Tenant = {
      ...target,
      status: 'Suspended',
      ownerDisplayStatus: 'suspended',
      tenantOperationalStatus: 'suspended',
    };
    dataService.changeTenantLifecycleStatus.mockImplementation(async () => {
      dataService.tenants.set([updatedTenant]);
      return {
        tenant: updatedTenant,
        billingSideEffect: {
          happened: false,
          type: 'none',
          invoiceId: null,
          invoiceRef: null,
          manualSettlementId: null,
          manualSettlementRef: null,
          paymentTransactionId: null,
        },
        audit: {
          id: 'audit-1',
          source: 'OWNER_MANUAL',
          outcome: 'success',
          previousStatus: 'pending',
          requestedTargetStatus: 'suspended',
          finalStatus: 'suspended',
          failureReason: null,
          createdAt: '2026-05-24T10:30:00Z',
        },
      } as TenantLifecycleStatusChangeResult;
    });

    store.requestStatusChange(target, 'Suspended');
    const success = await store.confirmStatusChange();

    const after = store.filteredTenants()[0];
    expect(success).toBe(true);
    expect(dataService.changeTenantLifecycleStatus).toHaveBeenCalledWith('tenant-1', {
      targetStatus: 'suspended',
      reason: 'Owner manual lifecycle change from /owner/tenants',
    });
    expect(after.status).toBe('Suspended');
    expect(after.ownerDisplayStatus).toBe('suspended');
    expect(after.providerPaymentStatus).toBe('pending');
    expect(after.tenantOperationalStatus).toBe('suspended');
    expect(after.subscriptionState).toBe('production');
    expect(after.settlementStatus).toBe('unpaid');
  });

  it('shows row-level pending state while the lifecycle request is in flight', async () => {
    const target = store.filteredTenants()[0];
    let resolveRequest: ((value: TenantLifecycleStatusChangeResult) => void) | undefined;

    dataService.changeTenantLifecycleStatus.mockImplementation(
      () =>
        new Promise<TenantLifecycleStatusChangeResult>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    store.requestStatusChange(target, 'Suspended');
    const submission = store.confirmStatusChange();

    expect(store.isLifecycleStatusPending(target.id)).toBe(true);
    expect(store.pendingStatusChange()).toBeNull();

    resolveRequest?.({
      tenant: {
        ...target,
        status: 'Suspended',
        ownerDisplayStatus: 'suspended',
        tenantOperationalStatus: 'suspended',
      },
      billingSideEffect: {
        happened: false,
        type: 'none',
        invoiceId: null,
        invoiceRef: null,
        manualSettlementId: null,
        manualSettlementRef: null,
        paymentTransactionId: null,
      },
      audit: {
        id: 'audit-1',
        source: 'OWNER_MANUAL',
        outcome: 'success',
        previousStatus: 'pending',
        requestedTargetStatus: 'suspended',
        finalStatus: 'suspended',
        failureReason: null,
        createdAt: '2026-05-24T10:30:00Z',
      },
    });

    await submission;
    expect(store.isLifecycleStatusPending(target.id)).toBe(false);
  });

  it('keeps the old row unchanged and shows an error when lifecycle status submission fails', async () => {
    const before = store.filteredTenants()[0];
    dataService.changeTenantLifecycleStatus.mockRejectedValue(
      new HttpErrorResponse({
        status: 409,
        error: { message: 'Tenant lifecycle update is not allowed right now' },
      }),
    );

    store.requestStatusChange(before, 'Suspended');
    const success = await store.confirmStatusChange();

    expect(success).toBe(false);
    expect(store.lifecycleStatusSubmissionError()).toBe('Tenant lifecycle update is not allowed right now');
    expect(store.filteredTenants()[0]).toEqual(before);
    expect(store.isLifecycleStatusPending(before.id)).toBe(false);
  });

  it('excludes Unknown from actionable statuses and ignores unsupported manual targets', async () => {
    const target = store.filteredTenants()[0];

    expect(store.statuses()).not.toContain('Unknown');

    store.requestStatusChange(target, 'Unknown');
    expect(store.pendingStatusChange()).toBeNull();

    const success = await store.confirmStatusChange();
    expect(success).toBe(false);
    expect(dataService.changeTenantLifecycleStatus).not.toHaveBeenCalled();
  });

  it('records manual settlement through the backend response and uses backend-derived status values', async () => {
    const updatedTenant: Tenant = {
      ...dataService.tenants()[0],
      status: 'Active',
      ownerDisplayStatus: 'active',
      providerPaymentStatus: 'failed',
      tenantOperationalStatus: 'active',
      subscriptionState: 'production',
      settlementStatus: 'manual_paid',
    };
    dataService.recordManualSettlement.mockImplementation(async () => {
      dataService.tenants.set([updatedTenant]);
      return {
        tenant: updatedTenant,
        manualSettlement: { id: 'ms-1' },
      };
    });

    store.requestManualSettlement({
      ...dataService.tenants()[0],
      providerPaymentStatus: 'failed',
      tenantOperationalStatus: 'suspended',
    });

    const success = await store.submitManualSettlement({
      paymentTransactionRef: 'FWK-1',
      manualInvoiceRef: 'INV-1',
      manualPaymentRef: 'PAY-1',
      amount: 149,
      currency: 'EGP',
      settledAt: '2026-05-24T10:30:00Z',
      evidenceRef: null,
      evidenceNote: null,
      note: null,
    });

    expect(success).toBe(true);
    expect(dataService.recordManualSettlement).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
      manualInvoiceRef: 'INV-1',
      amount: 149,
    }));
    const after = store.filteredTenants()[0];
    expect(after.providerPaymentStatus).toBe('failed');
    expect(after.settlementStatus).toBe('manual_paid');
    expect(after.ownerDisplayStatus).toBe('active');
    expect(after.tenantOperationalStatus).toBe('active');
    expect(after.subscriptionState).toBe('production');
    expect(store.pendingManualSettlement()).toBeNull();
  });

  it('shows a safe error and keeps the row unchanged when manual settlement fails', async () => {
    const before = {
      ...dataService.tenants()[0],
      providerPaymentStatus: 'cancelled' as const,
      tenantOperationalStatus: 'suspended' as const,
    };
    dataService.tenants.set([before]);
    dataService.recordManualSettlement.mockRejectedValue(
      new HttpErrorResponse({
        status: 409,
        error: { message: 'Manual invoice reference already exists for this tenant' },
      }),
    );

    store.requestManualSettlement(before);
    const success = await store.submitManualSettlement({
      paymentTransactionRef: null,
      manualInvoiceRef: 'INV-1',
      manualPaymentRef: 'PAY-1',
      amount: 149,
      currency: 'EGP',
      settledAt: '2026-05-24T10:30:00Z',
      evidenceRef: null,
      evidenceNote: null,
      note: null,
    });

    expect(success).toBe(false);
    expect(store.manualSettlementError()).toBe('Manual invoice reference already exists for this tenant');
    expect(store.filteredTenants()[0]).toEqual(before);
    expect(store.pendingManualSettlement()?.id).toBe(before.id);
  });
});
