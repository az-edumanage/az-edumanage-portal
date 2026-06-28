import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantBillingDataService } from '../../data-access/tenant-billing-data.service';
import { TenantBillingComponent } from './tenant-billing.component';
import { of } from 'rxjs';

describe('TenantBillingComponent', () => {
  let fixture: ComponentFixture<TenantBillingComponent>;
  let dataService: {
    listTenantStudentInvoices: ReturnType<typeof vi.fn>;
    markTenantStudentInvoicePaid: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dataService = {
      listTenantStudentInvoices: vi.fn(() => of({
        items: [invoice()],
        page: 0,
        size: 25,
        totalItems: 1,
      })),
      markTenantStudentInvoicePaid: vi.fn(() => of(invoice({ status: 'paid' }))),
    };

    await TestBed.configureTestingModule({
      imports: [TenantBillingComponent],
      providers: [
        { provide: TenantBillingDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantBillingComponent);
    fixture.detectChanges();
  });

  it('renders invoice table rows and status badges', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('TSI-1');
    expect(text).toContain('Ahmed Ali');
    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Unpaid');
  });

  it('shows empty state when no invoices exist', async () => {
    dataService.listTenantStudentInvoices.mockReturnValue(of({ items: [], page: 0, size: 25, totalItems: 0 }));

    fixture = TestBed.createComponent(TenantBillingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No enrollment invoices yet.');
  });

  it('marks unpaid invoice paid from row action', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.icon-action');

    button.click();
    fixture.detectChanges();

    expect(dataService.markTenantStudentInvoicePaid).toHaveBeenCalledWith('invoice-1');
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
