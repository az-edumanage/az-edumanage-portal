import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantBillingDataService } from '../data-access/tenant-billing-data.service';
import { TenantBillingStore } from './tenant-billing.store';

describe('TenantBillingStore', () => {
  let store: TenantBillingStore;
  let dataService: {
    listTenantStudentInvoices: ReturnType<typeof vi.fn>;
    markTenantStudentInvoicePaid: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listTenantStudentInvoices: vi.fn(() => of({ items: [], page: 0, size: 25, totalItems: 0 })),
      markTenantStudentInvoicePaid: vi.fn(() => of(invoice({ status: 'paid' }))),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TenantBillingDataService, useValue: dataService }],
    });
    store = TestBed.inject(TenantBillingStore);
  });

  it('loads invoice rows and pagination state', () => {
    dataService.listTenantStudentInvoices.mockReturnValue(of({
      items: [invoice()],
      page: 0,
      size: 25,
      totalItems: 1,
    }));

    store.loadInvoices();

    expect(store.invoices().length).toBe(1);
    expect(store.hasInvoices()).toBe(true);
    expect(store.totalItems()).toBe(1);
    expect(store.errorMessage()).toBeNull();
  });

  it('shows empty state when no invoices are returned', () => {
    store.loadInvoices();

    expect(store.invoices()).toEqual([]);
    expect(store.hasInvoices()).toBe(false);
  });

  it('captures load errors', () => {
    dataService.listTenantStudentInvoices.mockReturnValue(throwError(() => new Error('Unable to load invoices')));

    store.loadInvoices();

    expect(store.errorMessage()).toBe('Unable to load invoices');
    expect(store.invoices()).toEqual([]);
  });

  it('marks invoice paid and reloads rows', () => {
    store.markPaid('invoice-1');

    expect(dataService.markTenantStudentInvoicePaid).toHaveBeenCalledWith('invoice-1');
    expect(dataService.listTenantStudentInvoices).toHaveBeenCalled();
    expect(store.actionMessage()).toBe('Invoice marked as paid.');
  });
});

function invoice(overrides = {}) {
  return {
    id: 'invoice-1',
    invoiceRef: 'TSI-1',
    studentId: 'student-1',
    studentName: 'Ahmed Ali',
    groupId: 'group-1',
    groupName: 'Physics G12-A',
    amount: 500,
    currency: 'EGP',
    paymentMethodName: 'Monthly',
    durationType: 'MONTH',
    durationValue: 1,
    billingPeriodStart: '2026-06-01',
    billingPeriodEnd: '2026-07-01',
    status: 'unpaid',
    paidAt: null,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z',
    ...overrides,
  };
}
