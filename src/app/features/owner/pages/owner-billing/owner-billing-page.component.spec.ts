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
    invoices: signal(initialInvoices),
    loading: signal(false),
    loadError: signal<string | null>(null),
    tenantIdFilter: signal<string | null>(null),
    invoiceStatusFilter: signal<'paid' | 'open' | 'overdue' | null>(null),
    settlementStatusFilter: signal<'provider_paid' | 'manual_paid' | 'unpaid' | 'failed' | 'unknown' | null>(null),
    invoiceTypeFilter: signal<'first_payment' | 'renewal' | null>(null),
    issueDateFrom: signal(''),
    issueDateTo: signal(''),
    dueDateFrom: signal(''),
    dueDateTo: signal(''),
    isFiltered: signal(false),
    setActiveTab: () => {},
    setShowAdvancedFilters: () => {},
    setTenantIdFilter: () => {},
    setInvoiceStatusFilter: () => {},
    setSettlementStatusFilter: () => {},
    setInvoiceTypeFilter: () => {},
    setIssueDateFrom: () => {},
    setIssueDateTo: () => {},
    setDueDateFrom: () => {},
    setDueDateTo: () => {},
    applyFilters: vi.fn().mockResolvedValue(undefined),
    resetFilters: vi.fn().mockResolvedValue(undefined),
    clearTenantFilter: vi.fn().mockResolvedValue(undefined),
    copyToClipboard: vi.fn(),
    loadInvoices,
  };

  beforeEach(async () => {
    loadInvoices.mockClear();
    mockFacade.invoices.set(initialInvoices);
    mockFacade.loadError.set(null);
    mockFacade.tenantIdFilter.set(null);
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
});
