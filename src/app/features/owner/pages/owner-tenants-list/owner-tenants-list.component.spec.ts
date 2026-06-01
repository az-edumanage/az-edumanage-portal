import { signal } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { OwnerTenantsListComponent } from './owner-tenants-list.component';
import { OwnerTenantsListFacade } from '../../state/owner-tenants-list.facade';
import { I18nService } from '../../../../core/services/i18n.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { OwnerTenantStatusesDataService } from '../../data-access/owner-tenant-statuses-data.service';
import { OwnerTenantsDataService } from '../../data-access/owner-tenants-data.service';
import { TenantImpersonationService } from '../../../../core/auth/tenant-impersonation.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('OwnerTenantsListComponent', () => {
  const mockTenant = {
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
    subscriptionState: 'pending_payment',
    subscriptionType: 'production',
    createdBy: 'system',
  } as const;

  const mockFacade = {
    searchQuery: signal(''),
    showFiltersDropdown: signal(false),
    activeStatusDropdown: signal<string | null>(null),
    pendingStatusChange: signal(null),
    activePlanDropdown: signal<string | null>(null),
    pendingPlanChange: signal(null),
    pendingManualSettlement: signal<typeof mockTenant | null>(null),
    pendingLifecycleStatusTenantIds: signal(new Set<string>()),
    lifecycleStatusSubmissionError: signal<string | null>(null),
    manualSettlementSubmitting: signal(false),
    manualSettlementError: signal<string | null>(null),
    copyNotification: signal<string | null>(null),
    selectedStatuses: signal(new Set<string>()),
    selectedPlans: signal(new Set<string>()),
    selectedHealths: signal(new Set<string>()),
    statuses: signal(['Pending', 'Active', 'Suspended', 'Disabled', 'Blocked']),
    plans: ['Starter', 'Professional'],
    healths: ['Healthy', 'Degraded', 'Down'],
    activeFilterCount: signal(0),
    filteredTenants: signal([mockTenant]),
    toggleFilter: vi.fn(),
    clearFilters: vi.fn(),
    requestStatusChange: vi.fn(),
    confirmStatusChange: vi.fn().mockResolvedValue(true),
    cancelStatusChange: vi.fn(),
    isLifecycleStatusPending: (tenantId: string) => mockFacade.pendingLifecycleStatusTenantIds().has(tenantId),
    requestPlanChange: vi.fn(),
    confirmPlanChange: vi.fn(),
    cancelPlanChange: vi.fn(),
    canManualSettle: () => true,
    requestManualSettlement: vi.fn(),
    cancelManualSettlement: vi.fn(),
    submitManualSettlement: vi.fn().mockResolvedValue(true),
  };

  const mockI18n = {
    t: (text: string) => text,
    isRtl: signal(false),
  };

  const mockDashboardService = {
    returnUrl: signal(''),
    setRole: vi.fn(),
  };

  const mockStatusesData = {
    findByName: (name: string) => ({ nameEn: name, color: '#d97706' }),
  };

  const mockTenantsData = {
    loadFromBackend: () => Promise.resolve(),
  };

  const mockTenantImpersonationService = {
    start: vi.fn().mockResolvedValue({
      activeWorkspace: 'TENANT',
      impersonatedTenantId: 'tenant-1',
      impersonatedTenantName: 'Bright Center',
      startedByRole: 'OWNER',
      returnUrl: '/owner/tenants',
      startedAt: '2026-05-25T10:00:00Z',
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerTenantsListComponent],
      providers: [
        provideRouter([{ path: 'tenant/overview', component: DummyComponent }]),
        { provide: OwnerTenantsListFacade, useValue: mockFacade },
        { provide: I18nService, useValue: mockI18n },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: OwnerTenantStatusesDataService, useValue: mockStatusesData },
        { provide: OwnerTenantsDataService, useValue: mockTenantsData },
        { provide: TenantImpersonationService, useValue: mockTenantImpersonationService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    mockTenantImpersonationService.start.mockClear();
  });

  it('renders the row status badge from the tenant row model', () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Pending');
    expect(text).not.toContain('Pending Payment');
  });

  it('renders the Subscription column from trial vs production only', () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Production');
    expect(text).not.toContain('Pending Payment');
    expect(text).not.toContain('Expired');
    expect(text).not.toContain('Cancelled');
  });

  it('shows manual settlement action for an eligible tenant', () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('[data-testid="manual-settlement-action-tenant-1"]');
    expect(action).not.toBeNull();
  });

  it('does not show manual settlement action when the tenant is not eligible', () => {
    mockFacade.canManualSettle = () => false;

    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('[data-testid="manual-settlement-action-tenant-1"]');
    expect(action).toBeNull();

    mockFacade.canManualSettle = () => true;
  });

  it('maps the modal form values to the backend payload contract', async () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    fixture.componentInstance.openManualSettlement(mockTenant);
    mockFacade.pendingManualSettlement.set(mockTenant);
    fixture.detectChanges();

    fixture.componentInstance.manualSettlementForm.setValue({
      paymentTransactionRef: ' FWK-ABC123 ',
      manualInvoiceRef: ' INV-MAN-2026-0001 ',
      manualPaymentRef: ' BANK-TRF-9981 ',
      amount: 149,
      currency: ' EGP ',
      settledAt: '2026-05-24T10:30',
      evidenceRef: ' https://example.com/receipt.pdf ',
      evidenceNote: ' uploaded receipt ',
      note: ' offline confirmation ',
    });

    await fixture.componentInstance.submitManualSettlement();

    const expectedSettledAt = new Date('2026-05-24T10:30').toISOString();
    expect(mockFacade.submitManualSettlement).toHaveBeenCalledWith({
      paymentTransactionRef: ' FWK-ABC123 ',
      manualInvoiceRef: ' INV-MAN-2026-0001 ',
      manualPaymentRef: ' BANK-TRF-9981 ',
      amount: 149,
      currency: ' EGP ',
      settledAt: expectedSettledAt,
      evidenceRef: ' https://example.com/receipt.pdf ',
      evidenceNote: ' uploaded receipt ',
      note: ' offline confirmation ',
    });
  });

  it('excludes Unknown from the status action dropdown', () => {
    mockFacade.activeStatusDropdown.set('tenant-1');

    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Pending');
    expect(text).toContain('Blocked');
    expect(text).not.toContain('Unknown');
  });

  it('disables the status action while a lifecycle update is pending', () => {
    mockFacade.pendingLifecycleStatusTenantIds.set(new Set(['tenant-1']));

    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('[data-testid="status-action-tenant-1"]') as HTMLButtonElement | null;
    expect(action?.disabled).toBe(true);

    mockFacade.pendingLifecycleStatusTenantIds.set(new Set());
  });

  it('renders lifecycle submission errors without changing the existing table layout', () => {
    mockFacade.lifecycleStatusSubmissionError.set('Tenant lifecycle status could not be updated.');

    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Tenant lifecycle status could not be updated.');

    mockFacade.lifecycleStatusSubmissionError.set(null);
  });

  it('starts tenant impersonation from the row action and navigates to tenant overview', async () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    await fixture.componentInstance.impersonate(mockTenant as never);

    expect(mockTenantImpersonationService.start).toHaveBeenCalledWith(
      'tenant-1',
      'Bright Center',
      '/',
    );
  });
});
