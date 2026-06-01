import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { environment } from '../../../../environments/environment';
import { OwnerTenantDetailsDataService } from './owner-tenant-details-data.service';

describe('OwnerTenantDetailsDataService', () => {
  let service: OwnerTenantDetailsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OwnerTenantDetailsDataService,
        {
          provide: AuthApiService,
          useValue: {
            ensureLoggedIn: () => Promise.resolve(),
          },
        },
      ],
    });

    service = TestBed.inject(OwnerTenantDetailsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads tenant details by id from the tenant catalog endpoint', async () => {
    const responsePromise = firstValue(service.getTenantById('tenant-123'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/tenant-catalog/tenants/tenant-123');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'tenant-123',
      centerName: 'Hanaa Academy',
      tenantType: 'CENTER',
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
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: true,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: true,
      schemaName: 'tenant_hanaa',
      provisioningStatus: 'PROVISIONED',
      provisioningError: null,
      isActive: true,
      tenantOperationalStatus: 'ACTIVE',
      ownerDisplayStatus: 'ACTIVE',
      subscriptionState: 'TRIAL',
      subscriptionType: 'TRIAL',
      subscriptionStartedAt: null,
      currentPeriodStartAt: null,
      currentPeriodEndAt: null,
      nextBillingDate: null,
      billingStatus: null,
      openInvoice: null,
      providerPaymentStatus: null,
      settlementStatus: null,
      createdBy: 'SYSTEM',
      provisioningSource: 'OWNER_MANUAL',
      provisioningTriggeredBy: null,
      createdAt: '2026-05-24T10:30:00Z',
      updatedAt: '2026-05-25T11:45:00Z',
    });

    const tenant = await responsePromise;
    expect(tenant.id).toBe('tenant-123');
    expect(tenant.centerName).toBe('Hanaa Academy');
    expect(tenant.planId).toBe('plan-123');
    expect(tenant.planName).toBe('Professional');
    expect(tenant.status).toBe('Active');
    expect(tenant.tenantUrl).toBe('hanaa.example.com');
    expect(tenant.addressDisplay).toBe('10 Nile St, Cairo, Egypt');
  });

  it('keeps tenant detail readable when backend includes managed location fields', async () => {
    const responsePromise = firstValue(service.getTenantById('tenant-managed-location'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/tenant-catalog/tenants/tenant-managed-location');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'tenant-managed-location',
      centerName: 'Location Academy',
      tenantType: 'CENTER',
      subdomain: 'location-academy',
      domain: '.example.com',
      industry: 'Education',
      contactName: 'Location Owner',
      contactEmail: 'owner@location.test',
      contactPhone: '01000000001',
      address: '12 River St',
      city: 'Cairo',
      country: 'Egypt',
      countryId: 101,
      cityId: 202,
      countryNameEn: 'Egypt',
      countryNameAr: 'مصر',
      cityNameEn: 'Cairo',
      cityNameAr: 'القاهرة',
      planId: 'plan-location',
      planName: 'Professional',
      isTrial: false,
      trialDays: 0,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: true,
      schemaName: 'tenant_location',
      provisioningStatus: 'PROVISIONED',
      provisioningError: null,
      isActive: true,
      tenantOperationalStatus: 'ACTIVE',
      ownerDisplayStatus: 'ACTIVE',
      subscriptionState: 'PRODUCTION',
      subscriptionType: 'PAID',
      subscriptionStartedAt: null,
      currentPeriodStartAt: null,
      currentPeriodEndAt: null,
      nextBillingDate: null,
      billingStatus: null,
      openInvoice: null,
      providerPaymentStatus: null,
      settlementStatus: null,
      createdBy: 'SYSTEM',
      provisioningSource: 'OWNER_MANUAL',
      provisioningTriggeredBy: null,
      createdAt: '2026-05-24T10:30:00Z',
      updatedAt: '2026-05-25T11:45:00Z',
    });

    const tenant = await responsePromise;
    expect(tenant.city).toBe('Cairo');
    expect(tenant.country).toBe('Egypt');
    expect(tenant.addressDisplay).toBe('12 River St, Cairo, Egypt');
    expect(tenant.status).toBe('Active');
  });


  it('maps tenant subscription dates, billing status, and open invoice summary', async () => {
    const responsePromise = firstValue(service.getTenantById('tenant-billing'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/tenant-catalog/tenants/tenant-billing');
    request.flush({
      id: 'tenant-billing',
      centerName: 'Renewal Academy',
      tenantType: 'CENTER',
      subdomain: 'renewal',
      domain: '.example.com',
      industry: 'Education',
      contactName: 'Owner',
      contactEmail: 'owner@renewal.test',
      contactPhone: null,
      address: null,
      city: null,
      country: null,
      planId: 'plan-pro',
      planName: 'Professional',
      isTrial: false,
      trialDays: 0,
      region: null,
      autoProvision: true,
      sendInvite: false,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false,
      schemaName: null,
      provisioningStatus: 'PROVISIONED',
      provisioningError: null,
      isActive: true,
      tenantOperationalStatus: 'ACTIVE',
      ownerDisplayStatus: 'ACTIVE',
      subscriptionState: 'PRODUCTION',
      subscriptionType: 'PAID',
      subscriptionStartedAt: '2026-05-28T10:00:00Z',
      currentPeriodStartAt: '2026-05-28T10:00:00Z',
      currentPeriodEndAt: '2026-06-27T10:00:00Z',
      nextBillingDate: '2026-06-27T10:00:00Z',
      billingStatus: 'OPEN_INVOICE',
      openInvoice: {
        id: 'invoice-open',
        invoiceRef: 'INV-2026-OPEN',
        amount: 1499,
        currency: 'EGP',
        periodStartAt: '2026-06-27T10:00:00Z',
        periodEndAt: '2026-07-27T10:00:00Z',
        dueDate: '2026-06-27T10:00:00Z',
        status: 'open',
      },
      providerPaymentStatus: null,
      settlementStatus: 'UNPAID',
      createdBy: 'SYSTEM',
      provisioningSource: 'OWNER_MANUAL',
      provisioningTriggeredBy: null,
      createdAt: '2026-05-24T10:30:00Z',
      updatedAt: '2026-05-25T11:45:00Z',
    });

    const tenant = await responsePromise;
    expect(tenant.subscriptionStartedAt).toBe('May 28, 2026');
    expect(tenant.currentPeriodStartAt).toBe('May 28, 2026');
    expect(tenant.currentPeriodEndAt).toBe('Jun 27, 2026');
    expect(tenant.nextBillingDate).toBe('Jun 27, 2026');
    expect(tenant.billingStatus).toBe('Open Invoice');
    expect(tenant.openInvoice).toEqual({
      id: 'invoice-open',
      invoiceRef: 'INV-2026-OPEN',
      amount: '1,499',
      currency: 'EGP',
      periodStartAt: 'Jun 27, 2026',
      periodEndAt: 'Jul 27, 2026',
      dueDate: 'Jun 27, 2026',
      status: 'Open',
    });
  });

  it('maps missing optional fields to placeholders without mock fallback', async () => {
    const responsePromise = firstValue(service.getTenantById('tenant-empty'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/tenant-catalog/tenants/tenant-empty');
    request.flush({
      id: 'tenant-empty',
      centerName: null,
      tenantType: null,
      subdomain: null,
      domain: null,
      industry: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      address: null,
      city: null,
      country: null,
      planId: null,
      planName: null,
      isTrial: null,
      trialDays: null,
      region: null,
      autoProvision: null,
      sendInvite: null,
      onboardingLink: null,
      sendOnboardingWhatsapp: null,
      sendOnboardingEmail: null,
      schemaName: null,
      provisioningStatus: null,
      provisioningError: null,
      isActive: false,
      tenantOperationalStatus: null,
      ownerDisplayStatus: null,
      subscriptionState: null,
      subscriptionType: null,
      subscriptionStartedAt: null,
      currentPeriodStartAt: null,
      currentPeriodEndAt: null,
      nextBillingDate: null,
      billingStatus: null,
      openInvoice: null,
      providerPaymentStatus: null,
      settlementStatus: null,
      createdBy: null,
      provisioningSource: null,
      provisioningTriggeredBy: null,
      createdAt: null,
      updatedAt: null,
    });

    const tenant = await responsePromise;
    expect(tenant.centerName).toBe('—');
    expect(tenant.contactEmail).toBe('—');
    expect(tenant.planName).toBe('—');
    expect(tenant.addressDisplay).toBe('—');
    expect(tenant.usageStudents).toBe('—');
    expect(tenant.nextBillingDate).toBe('—');
    expect(tenant.billingStatus).toBe('—');
    expect(tenant.openInvoice).toBeNull();
    expect(tenant.status).toBe('Inactive');
  });

  it('loads tenant billing history from the owner billing invoices endpoint', async () => {
    const responsePromise = firstValue(service.getTenantBillingHistory('tenant-history'));
    await Promise.resolve();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url === environment.apiBaseUrl + '/owner/billing/invoices' &&
      candidate.params.get('tenantId') === 'tenant-history' &&
      candidate.params.get('page') === '0' &&
      candidate.params.get('size') === '5',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [
        {
          id: 'invoice-1',
          invoiceRef: 'REAL-2026-001',
          issueDate: '2026-05-29T08:00:00Z',
          amount: 1499,
          currency: 'EGP',
          invoiceStatus: 'open',
          downloadUrl: 'https://example.test/invoices/invoice-1.pdf',
        },
      ],
    });

    const rows = await responsePromise;
    expect(rows).toEqual([
      {
        id: 'invoice-1',
        invoice: 'REAL-2026-001',
        date: 'May 29, 2026',
        amount: '1,499 EGP',
        status: 'Open',
        downloadUrl: 'https://example.test/invoices/invoice-1.pdf',
      },
    ]);
  });

  it('maps tenant billing history fallback fields and missing values to placeholders', async () => {
    const responsePromise = firstValue(service.getTenantBillingHistory('tenant-history'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/owner/billing/invoices?tenantId=tenant-history&page=0&size=5');
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [
        {
          id: 'invoice-2',
          invoiceNumber: 'REAL-2026-002',
          createdAt: '2026-06-01T10:00:00Z',
          amount: 2500,
          settlementStatus: 'manual_paid',
        },
        {
          id: 'invoice-3',
          reference: 'REAL-2026-003',
          dueDate: '2026-06-10T10:00:00Z',
          amount: null,
          status: null,
          downloadUrl: '   ',
        },
        { id: null },
      ],
    });

    const rows = await responsePromise;
    expect(rows).toEqual([
      {
        id: 'invoice-2',
        invoice: 'REAL-2026-002',
        date: 'Jun 01, 2026',
        amount: '2,500',
        status: 'Manual Paid',
        downloadUrl: null,
      },
      {
        id: 'invoice-3',
        invoice: 'REAL-2026-003',
        date: 'Jun 10, 2026',
        amount: '—',
        status: '—',
        downloadUrl: null,
      },
      {
        id: 'billing-history-2',
        invoice: '—',
        date: '—',
        amount: '—',
        status: '—',
        downloadUrl: null,
      },
    ]);
  });

  it('maps empty tenant billing history responses to an empty list', async () => {
    const responsePromise = firstValue(service.getTenantBillingHistory('tenant-empty-history'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/owner/billing/invoices?tenantId=tenant-empty-history&page=0&size=5');
    expect(request.request.method).toBe('GET');
    request.flush({});

    await expect(responsePromise).resolves.toEqual([]);
  });

  it('does not return static tenant billing history values', async () => {
    const responsePromise = firstValue(service.getTenantBillingHistory('tenant-no-mock-history'));
    await Promise.resolve();

    const request = httpTesting.expectOne(environment.apiBaseUrl + '/owner/billing/invoices?tenantId=tenant-no-mock-history&page=0&size=5');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [] });

    const rows = await responsePromise;
    expect(JSON.stringify(rows)).not.toContain('INV-2024-001');
    expect(JSON.stringify(rows)).not.toContain('INV-2024-002');
    expect(JSON.stringify(rows)).not.toContain('Jan 15, 2024');
    expect(JSON.stringify(rows)).not.toContain('Mar 01, 2024');
  });
});

function firstValue<T>(source: import('rxjs').Observable<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    source.subscribe({ next: resolve, error: reject });
  });
}
