import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerApiService } from '../data-access/owner-api.service';
import { OwnerTenantDetailsDataService } from '../data-access/owner-tenant-details-data.service';
import { OwnerTenantDetails, TenantBillingHistoryRow } from '../models/owner-tenant-details.models';
import { OwnerTenantDetailsFacade } from './owner-tenant-details.facade';
import { OwnerTenantDetailsStore } from './owner-tenant-details.store';

describe('OwnerTenantDetailsFacade', () => {
  let facade: OwnerTenantDetailsFacade;
  let store: OwnerTenantDetailsStore;
  let getTenantById: ReturnType<typeof vi.fn>;
  let getPlanOptions: ReturnType<typeof vi.fn>;
  let getTenantBillingHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getTenantById = vi.fn();
    getPlanOptions = vi.fn().mockReturnValue([]);
    getTenantBillingHistory = vi.fn().mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        OwnerTenantDetailsFacade,
        OwnerTenantDetailsStore,
        {
          provide: OwnerTenantDetailsDataService,
          useValue: {
            getTenantById,
            getPlanOptions,
            getTenantBillingHistory,
            getPlanPrice: vi.fn().mockReturnValue('—'),
            getPlanName: vi.fn().mockReturnValue(''),
          },
        },
        {
          provide: OwnerApiService,
          useValue: { upgradeTenantPlan: vi.fn().mockReturnValue(of(undefined)) },
        },
        {
          provide: DashboardService,
          useValue: { returnUrl: signal(''), setRole: vi.fn() },
        },
        { provide: Router, useValue: { url: '/owner/tenants/tenant-123', navigate: vi.fn() } },
        { provide: Location, useValue: { back: vi.fn() } },
      ],
    });

    facade = TestBed.inject(OwnerTenantDetailsFacade);
    store = TestBed.inject(OwnerTenantDetailsStore);
  });

  it('sets loading while tenant detail request is pending and stores loaded tenant', () => {
    const tenant = tenantDetails();
    const request = new Subject<OwnerTenantDetails>();
    getTenantById.mockReturnValue(request.asObservable());

    facade.initialize('tenant-123');

    expect(store.loading()).toBe(true);
    expect(store.tenant()).toBeNull();
    expect(getTenantById).toHaveBeenCalledWith('tenant-123');

    request.next(tenant);
    request.complete();

    expect(store.loading()).toBe(false);
    expect(store.tenant()?.id).toBe('tenant-123');
    expect(store.loadError()).toBeNull();
    expect(store.notFound()).toBe(false);
    expect(getPlanOptions).toHaveBeenCalledWith(tenant);
  });

  it('marks not-found and does not retain a static tenant after a 404', () => {
    getTenantById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    facade.initialize('missing-tenant');

    expect(store.loading()).toBe(false);
    expect(store.tenant()).toBeNull();
    expect(store.plans()).toEqual([]);
    expect(store.modules()).toEqual([]);
    expect(store.notFound()).toBe(true);
    expect(store.loadError()).toBe('Tenant details could not be loaded.');
    expect(facade.tenant.centerName).toBe('—');
  });

  it('marks generic API errors without using mock fallback data', () => {
    getTenantById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
    );

    facade.initialize('tenant-123');

    expect(store.loading()).toBe(false);
    expect(store.tenant()).toBeNull();
    expect(store.notFound()).toBe(false);
    expect(store.loadError()).toBe('Tenant details could not be loaded.');
    expect(facade.tenant.id).toBe('—');
  });

  it('loads billing history alongside tenant details and stores successful rows', () => {
    const tenant = tenantDetails();
    const tenantRequest = new Subject<OwnerTenantDetails>();
    const billingRequest = new Subject<TenantBillingHistoryRow[]>();
    const rows: TenantBillingHistoryRow[] = [
      { id: 'invoice-1', invoice: 'REAL-2026-001', date: 'May 29, 2026', amount: '1,499 EGP', status: 'Open' },
    ];
    getTenantById.mockReturnValue(tenantRequest.asObservable());
    getTenantBillingHistory.mockReturnValue(billingRequest.asObservable());

    facade.initialize('tenant-123');

    expect(getTenantBillingHistory).toHaveBeenCalledWith('tenant-123');
    expect(store.billingHistory()).toEqual([]);
    expect(store.billingHistoryLoading()).toBe(true);
    expect(store.billingHistoryError()).toBeNull();

    billingRequest.next(rows);
    billingRequest.complete();
    tenantRequest.next(tenant);
    tenantRequest.complete();

    expect(store.billingHistory()).toEqual(rows);
    expect(store.billingHistoryLoading()).toBe(false);
    expect(store.billingHistoryError()).toBeNull();
    expect(store.tenant()?.id).toBe('tenant-123');
  });

  it('stores empty billing history success without setting an error', () => {
    getTenantById.mockReturnValue(of(tenantDetails()));
    getTenantBillingHistory.mockReturnValue(of([]));

    facade.initialize('tenant-empty-history');

    expect(store.billingHistory()).toEqual([]);
    expect(store.billingHistoryLoading()).toBe(false);
    expect(store.billingHistoryError()).toBeNull();
  });

  it('clears billing rows and records billing error without disturbing tenant details', () => {
    const tenant = tenantDetails();
    store.setBillingHistory([
      { id: 'stale-invoice', invoice: 'STALE-001', date: 'May 01, 2026', amount: '100 EGP', status: 'Open' },
    ]);
    getTenantById.mockReturnValue(of(tenant));
    getTenantBillingHistory.mockReturnValue(throwError(() => new Error('billing failed')));

    facade.initialize('tenant-123');

    expect(store.billingHistory()).toEqual([]);
    expect(store.billingHistoryLoading()).toBe(false);
    expect(store.billingHistoryError()).toBe('Billing history could not be loaded.');
    expect(store.tenant()).toEqual(tenant);
    expect(store.loadError()).toBeNull();
  });
});

function tenantDetails(): OwnerTenantDetails {
  return {
    id: 'tenant-123',
    centerName: 'Hanaa Academy',
    tenantType: 'Center',
    subdomain: 'hanaa',
    domain: '.example.com',
    industry: 'Education',
    contactName: 'Hanaa Owner',
    contactEmail: 'owner@hanaa.test',
    contactPhone: '01000000000',
    address: '10 Nile St',
    city: 'Cairo',
    country: 'Egypt',
    planId: 'plan-123',
    planName: 'Professional',
    isTrial: false,
    trialDays: 0,
    region: 'me-south-1',
    autoProvision: true,
    sendInvite: true,
    onboardingLink: false,
    sendOnboardingWhatsapp: false,
    sendOnboardingEmail: false,
    schemaName: 'tenant_hanaa',
    provisioningStatus: 'Provisioned',
    provisioningError: '—',
    isActive: true,
    tenantOperationalStatus: 'Active',
    ownerDisplayStatus: 'Active',
    subscriptionState: 'Production',
    subscriptionType: 'Production',
    subscriptionStartedAt: 'May 24, 2026',
    currentPeriodStartAt: 'May 24, 2026',
    currentPeriodEndAt: 'Jun 23, 2026',
    billingStatus: 'Active',
    openInvoice: null,
    providerPaymentStatus: 'Paid',
    settlementStatus: 'Provider Paid',
    createdBy: 'System',
    provisioningSource: 'Owner Manual',
    provisioningTriggeredBy: '—',
    status: 'Active',
    createdDate: 'May 24, 2026',
    updatedDate: 'May 25, 2026',
    addressDisplay: '10 Nile St, Cairo, Egypt',
    tenantUrl: 'hanaa.example.com',
    nextBillingDate: '—',
    usageStudents: '—',
    usageStudentsLimit: '—',
    usageStorage: '—',
    usageStorageLimit: '—',
    usageApiCalls: '—',
    usageApiCallsLimit: '—',
  };
}
