import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OwnerBillingDataService } from './owner-billing-data.service';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { environment } from '../../../../environments/environment';
import { vi } from 'vitest';


describe('OwnerBillingDataService', () => {
  let service: OwnerBillingDataService;
  let httpTesting: HttpTestingController;
  let authApi: { ensureLoggedIn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authApi = { ensureLoggedIn: vi.fn().mockResolvedValue('token') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OwnerBillingDataService,
        { provide: AuthApiService, useValue: authApi },
      ],
    });

    service = TestBed.inject(OwnerBillingDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads owner invoices from the backend endpoint and maps display fields', async () => {
    const promise = service.listInvoices({ page: 0, size: 25, status: 'paid', search: 'bright' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url === `${environment.apiBaseUrl}/owner/billing/invoices`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('25');
    expect(request.request.params.get('status')).toBe('paid');
    expect(request.request.params.get('search')).toBe('bright');

    request.flush({
      items: [
        {
          id: 'invoice-1',
          invoiceRef: 'INV-2026-0001',
          tenantId: 'tenant-1',
          tenantName: 'Bright Future Academy',
          planId: 'plan-1',
          planName: 'Professional',
          invoiceType: 'first_payment',
          issueDate: '2026-05-01T00:00:00Z',
          dueDate: '2026-05-10T00:00:00Z',
          amount: 149,
          currency: 'EGP',
          providerPaymentStatusSnapshot: 'paid',
          settlementStatus: 'provider_paid',
          invoiceStatus: 'paid',
          source: 'payment_webhook',
          paymentTransactionId: 'tx-1',
          paymentTransactionRef: 'FWK-001',
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-02T00:00:00Z',
        },
      ],
      page: 0,
      size: 25,
      totalItems: 1,
    });

    const response = await promise;
    expect(authApi.ensureLoggedIn).toHaveBeenCalled();
    expect(response.totalItems).toBe(1);
    expect(response.items[0]).toMatchObject({
      id: 'invoice-1',
      invoiceRef: 'INV-2026-0001',
      tenant: 'Bright Future Academy',
      tenantId: 'tenant-1',
      plan: 'Professional',
      status: 'Paid',
      settlementStatus: 'provider_paid',
      source: 'payment_webhook',
      paymentTransactionRef: 'FWK-001',
    });
  });

  it('maps manual activation invoices without a payment transaction', async () => {
    const promise = service.listInvoices();
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/owner/billing/invoices`);
    request.flush({
      items: [
        {
          id: 'invoice-2',
          invoiceRef: 'INV-MAN-0002',
          tenantId: 'tenant-2',
          tenantName: 'Manual Center',
          planName: 'Starter',
          amount: 49,
          invoiceStatus: 'paid',
          settlementStatus: 'manual_paid',
          source: 'manual_admin_activation',
          paymentTransactionId: null,
          paymentTransactionRef: null,
          manualSettlementId: 'manual-1',
          manualInvoiceRef: 'MAN-001',
          createdAt: '2026-05-03T00:00:00Z',
          updatedAt: '2026-05-03T00:00:00Z',
        },
      ],
    });

    const response = await promise;
    expect(response.items[0].source).toBe('manual_admin_activation');
    expect(response.items[0].paymentTransactionId).toBeNull();
    expect(response.items[0].manualSettlementId).toBe('manual-1');
  });
});
