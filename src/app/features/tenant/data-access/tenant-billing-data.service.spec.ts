import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantBillingDataService } from './tenant-billing-data.service';

describe('TenantBillingDataService', () => {
  let service: TenantBillingDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TenantBillingDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads tenant invoices with query parameters', () => {
    service.listTenantStudentInvoices({
      status: 'unpaid',
      category: 'overdue',
      search: 'Ahmed',
      studentId: 'student-1',
      page: 1,
      size: 25,
    }).subscribe((response) => {
      expect(response.items[0].invoiceRef).toBe('TSI-1');
      expect(response.totalItems).toBe(1);
      expect(response.summary.overdueInvoices).toBe(1);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/billing/invoices'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('unpaid');
    expect(request.request.params.get('category')).toBe('overdue');
    expect(request.request.params.get('search')).toBe('Ahmed');
    expect(request.request.params.get('studentId')).toBe('student-1');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('25');
    request.flush({
      items: [invoice({ id: 'invoice-1', invoiceRef: 'TSI-1' })],
      page: 1,
      size: 25,
      totalItems: 1,
      summary: summary(),
    });
  });

  it('marks an invoice paid', () => {
    service.markTenantStudentInvoicePaid('invoice-1').subscribe((response) => {
      expect(response.status).toBe('paid');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/billing/invoices/invoice-1/paid'));
    expect(request.request.method).toBe('PATCH');
    request.flush(invoice({ id: 'invoice-1', status: 'paid' }));
  });
});

function invoice(overrides: Partial<ReturnType<typeof baseInvoice>> = {}) {
  return { ...baseInvoice(), ...overrides };
}

function summary() {
  return {
    totalInvoices: 3,
    paidInvoices: 1,
    unpaidInvoices: 2,
    overdueInvoices: 1,
  };
}

function baseInvoice() {
  return {
    id: 'invoice-1',
    invoiceRef: 'TSI-1',
    studentId: 'student-1',
    studentName: 'Ahmed Ali',
    groupId: 'group-1',
    groupName: 'Physics G12-A',
    amount: 500,
    currency: 'EGP',
    paymentMethodId: 'period-1',
    paymentMethodName: 'Monthly',
    durationType: 'MONTH',
    durationValue: 1,
    billingPeriodStart: '2026-06-01',
    billingPeriodEnd: '2026-07-01',
    status: 'unpaid' as 'unpaid' | 'paid',
    paidAt: null,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z',
  };
}
