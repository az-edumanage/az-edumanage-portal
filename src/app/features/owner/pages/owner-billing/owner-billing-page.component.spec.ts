import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OwnerBillingPageComponent } from './owner-billing-page.component';
import { OwnerBillingFacade } from '../../state/owner-billing.facade';

describe('OwnerBillingPageComponent', () => {
  const loadInvoices = vi.fn().mockResolvedValue(undefined);
  const initialInvoices = [
    {
      id: 'invoice-1',
      invoiceRef: 'INV-2026-0001',
      tenantId: 'tenant-1',
      tenantName: 'Bright Future Academy',
      planId: 'plan-1',
      planName: 'Enterprise',
      invoiceType: 'first_payment' as const,
      billingCycle: 'monthly',
      subscriptionCycleId: 1,
      issueDate: '2026-05-01T00:00:00Z',
      dueDate: '2026-05-10T00:00:00Z',
      graceUntil: '2026-05-15T00:00:00Z',
      billingPeriodStart: '2026-05-01T00:00:00Z',
      billingPeriodEnd: '2026-05-31T23:59:59Z',
      amount: 149,
      currency: 'EGP',
      providerPaymentStatusSnapshot: 'failed',
      settlementStatus: 'manual_paid' as const,
      invoiceStatus: 'paid' as const,
      paidAt: '2026-05-02T00:00:00Z',
      paymentTransactionId: 'tx-1',
      paymentTransactionRef: 'FWK-123',
      manualSettlementId: 'ms-1',
      manualInvoiceRef: 'MAN-INV-001',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-02T00:00:00Z',
    },
    {
      id: 'invoice-2',
      invoiceRef: 'INV-2026-0002',
      tenantId: 'tenant-2',
      tenantName: 'Cairo Math Center',
      planId: 'plan-2',
      planName: 'Professional',
      invoiceType: 'renewal' as const,
      invoiceSource: 'scheduled_renewal',
      source: 'scheduled_renewal',
      billingCycle: 'monthly',
      subscriptionCycleId: 1,
      issueDate: '2026-06-01T00:00:00Z',
      dueDate: '2026-06-10T00:00:00Z',
      graceUntil: null,
      billingPeriodStart: '2026-06-01T00:00:00Z',
      billingPeriodEnd: '2026-06-30T23:59:59Z',
      amount: 99,
      currency: 'EGP',
      providerPaymentStatusSnapshot: 'pending',
      settlementStatus: 'unpaid' as const,
      invoiceStatus: 'open' as const,
      paidAt: null,
      paymentTransactionId: null,
      paymentTransactionRef: null,
      manualSettlementId: null,
      manualInvoiceRef: null,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    },
    {
      id: 'invoice-3',
      invoiceRef: 'INV-2026-0003',
      tenantId: 'tenant-3',
      tenantName: 'Physics Pro',
      planId: 'plan-3',
      planName: 'Starter',
      invoiceType: 'renewal' as const,
      billingCycle: 'annual',
      subscriptionCycleId: 2,
      issueDate: '2026-07-01T00:00:00Z',
      dueDate: '2026-07-10T00:00:00Z',
      graceUntil: '2026-07-20T00:00:00Z',
      billingPeriodStart: '2026-07-01T00:00:00Z',
      billingPeriodEnd: '2026-07-31T23:59:59Z',
      amount: 49,
      currency: 'EGP',
      providerPaymentStatusSnapshot: 'failed',
      settlementStatus: 'failed' as const,
      invoiceStatus: 'overdue' as const,
      paidAt: null,
      paymentTransactionId: 'tx-3',
      paymentTransactionRef: 'FWK-333',
      manualSettlementId: null,
      manualInvoiceRef: null,
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-15T00:00:00Z',
    },
  ];
  const mockFacade = {
    activeTab: signal<'invoices'>('invoices'),
    showAdvancedFilters: signal(false),
    showRefundModal: signal(false),
    invoiceToRefund: signal(null),
    tenantFilter: signal<string | null>(null),
    searchQuery: signal(''),
    filterStatus: signal('All'),
    filterMinAmount: signal<number | null>(null),
    filterMaxAmount: signal<number | null>(null),
    invoices: signal(initialInvoices),
    loading: signal(false),
    loadError: signal<string | null>(null),
    isFiltered: signal(false),
    maxRevenue: signal(0),
    monthlyReports: signal([]),
    filteredPayments: signal([]),
    filteredFailedPayments: signal([
      {
        id: 'FWK-333',
        tenant: 'Physics Pro',
        amount: 49,
        reason: 'Payment failed',
        retryCount: 0,
        lastAttempt: '2026-07-01T00:00:00Z',
        gracePeriodEnd: 'Jul 20, 2026',
      },
    ]),
    filteredRefunds: signal([]),
    setActiveTab: vi.fn(),
    setShowAdvancedFilters: vi.fn(),
    setSearchQuery: vi.fn(),
    setFilterStatus: vi.fn(),
    setFilterMinAmount: vi.fn(),
    setFilterMaxAmount: vi.fn(),
    setTenantFilter: vi.fn(),
    resetFilters: vi.fn(),
    clearTenantFilter: vi.fn(),
    generateReport: vi.fn(),
    copyToClipboard: vi.fn(),
    openRefund: vi.fn(),
    closeRefund: vi.fn(),
    confirmRefund: vi.fn(),
    manualPayInvoice: vi.fn().mockResolvedValue(undefined),
    manualPayPendingInvoiceId: signal<string | null>(null),
    loadInvoices,
  };

  beforeEach(async () => {
    loadInvoices.mockClear();
    mockFacade.invoices.set(initialInvoices);
    mockFacade.loadError.set(null);
    mockFacade.tenantFilter.set(null);
    mockFacade.filteredFailedPayments.set([
      {
        id: 'FWK-333',
        tenant: 'Physics Pro',
        amount: 49,
        reason: 'Payment failed',
        retryCount: 0,
        lastAttempt: '2026-07-01T00:00:00Z',
        gracePeriodEnd: 'Jul 20, 2026',
      },
    ]);
    mockFacade.manualPayInvoice.mockClear();
    await TestBed.configureTestingModule({
      imports: [OwnerBillingPageComponent],
      providers: [
        { provide: OwnerBillingFacade, useValue: mockFacade },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();
  });

  it('renders paid, open, and overdue invoices from backend truth', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('INV-2026-0001');
    expect(text).toContain('Bright Future Academy');
    expect(text).toContain('Paid');
    expect(text).toContain('Open');
    expect(text).toContain('Overdue');
    expect(text).toContain('Manual Paid');
    expect(text).toContain('failed');
  });



  it('renders invoice cycle, period, and scheduler status metadata', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Monthly');
    expect(text).toContain('Annual');
    expect(text).toContain('2026-06-01T00:00:00Z - 2026-06-30T23:59:59Z');
    expect(text).toContain('Scheduled Renewal');
    expect(text).toContain('Open');
  });

  it('shows a safe empty state when no invoices are returned', () => {
    mockFacade.invoices.set([]);
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('No invoices found');
    expect(text).toContain('No invoice obligations matched the current filters.');
  });

  it('shows a safe error state when invoice loading fails', () => {
    mockFacade.loadError.set('Billing invoices could not be loaded right now.');
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Invoices unavailable');
    expect(text).toContain('Billing invoices could not be loaded right now.');
    mockFacade.loadError.set(null);
  });

  it('loads invoices when the page initializes', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    expect(loadInvoices).toHaveBeenCalled();
  });

  it('shows Manual Pay only for open invoices and dispatches the selected invoice', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[title="Manual Pay"]');
    expect(buttons.length).toBe(1);

    buttons[0].click();
    expect(mockFacade.manualPayInvoice).toHaveBeenCalledWith(initialInvoices[1]);
  });

  it('does not render proof review actions or modal content', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(fixture.nativeElement.querySelector('button[title="View Proof"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[title="Review Payment Proof"]')).toBeNull();
    expect(text).not.toContain('Payment Proof Review');
    expect(text).not.toContain('Confirm & Mark as Paid');
  });

  it('shows the failed payments badge from the failed payment rows', () => {
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Failed Payments 1');
  });

  it('shows zero in the failed payments badge when there are no failed payment rows', () => {
    mockFacade.filteredFailedPayments.set([]);
    const fixture = TestBed.createComponent(OwnerBillingPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Failed Payments 0');
  });
});
