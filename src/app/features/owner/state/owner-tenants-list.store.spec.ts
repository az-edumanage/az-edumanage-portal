import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { OwnerTenantsListStore } from './owner-tenants-list.store';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import { ManualSettlementRequest, Tenant } from '../models/owner-tenants.models';

describe('OwnerTenantsListStore', () => {
  let store: OwnerTenantsListStore;
  let dataService: {
    tenants: WritableSignal<Tenant[]>;
    updateTenantPlan: (...args: unknown[]) => void;
    recordManualSettlement: ReturnType<typeof vi.fn>;
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
          subscriptionType: 'production',
          createdBy: 'system',
        },
      ]),
      updateTenantPlan: () => {},
      recordManualSettlement: vi.fn(),
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

  it('clears pendingStatusChange after confirm', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();
    expect(store.pendingStatusChange()).toBeNull();
  });

  it('does not mutate backend-derived status fields when confirming a pending status change', () => {
    const target = store.filteredTenants()[0];

    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();

    const after = store.filteredTenants()[0];
    expect(after.status).toBe('Pending');
    expect(after.ownerDisplayStatus).toBe('pending');
    expect(after.providerPaymentStatus).toBe('pending');
    expect(after.tenantOperationalStatus).toBe('active');
    expect(after.settlementStatus).toBe('unpaid');
  });

  it('records manual settlement through the backend response and uses backend-derived status values', async () => {
    const updatedTenant: Tenant = {
      ...dataService.tenants()[0],
      status: 'Active',
      ownerDisplayStatus: 'active',
      providerPaymentStatus: 'failed',
      tenantOperationalStatus: 'active',
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
