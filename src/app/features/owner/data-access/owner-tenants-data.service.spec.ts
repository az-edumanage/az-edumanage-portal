import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OwnerTenantsDataService } from './owner-tenants-data.service';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { environment } from '../../../../environments/environment';

describe('OwnerTenantsDataService', () => {
  let service: OwnerTenantsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OwnerTenantsDataService,
        {
          provide: AuthApiService,
          useValue: {
            ensureLoggedIn: () => Promise.resolve(),
          },
        },
      ],
    });

    service = TestBed.inject(OwnerTenantsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('maps refreshed owner tenants rows from the persisted lifecycle field', async () => {
    const loadPromise = service.loadFromBackend();
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant-catalog/tenants`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'tenant-1',
        centerName: 'Bright Center',
        tenantType: 'CENTER',
        subdomain: 'bright-center',
        domain: 'bright-center.example.com',
        industry: 'Education',
        contactName: 'Owner Name',
        contactEmail: 'owner@example.com',
        contactPhone: '01000000000',
        planName: 'Professional',
        isTrial: false,
        subscriptionState: 'pending_payment',
        subscriptionType: 'production',
        createdBy: 'system',
        providerPaymentStatus: 'pending',
        tenantOperationalStatus: 'disabled',
        settlementStatus: 'unpaid',
        ownerDisplayStatus: 'pending',
        createdAt: '2026-05-24T10:30:00Z',
      },
    ]);

    await loadPromise;

    const tenant = service.tenants()[0];
    expect(tenant.status).toBe('Disabled');
    expect(tenant.ownerDisplayStatus).toBe('pending');
    expect(tenant.tenantOperationalStatus).toBe('disabled');
  });

  it('maps tenant list rows when backend includes managed location fields', async () => {
    const loadPromise = service.loadFromBackend();
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant-catalog/tenants`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'tenant-location',
        centerName: 'Location Center',
        tenantType: 'CENTER',
        subdomain: 'location-center',
        domain: 'location-center.example.com',
        industry: 'Education',
        contactName: 'Location Owner',
        contactEmail: 'location-owner@example.com',
        contactPhone: '01000000002',
        countryId: 101,
        cityId: 202,
        countryNameEn: 'Egypt',
        countryNameAr: 'مصر',
        cityNameEn: 'Cairo',
        cityNameAr: 'القاهرة',
        planName: 'Professional',
        isTrial: false,
        subscriptionState: 'production',
        subscriptionType: 'production',
        createdBy: 'system',
        providerPaymentStatus: 'paid',
        tenantOperationalStatus: 'active',
        settlementStatus: 'provider_paid',
        ownerDisplayStatus: 'active',
        createdAt: '2026-05-24T10:30:00Z',
      },
    ]);

    await loadPromise;

    const tenant = service.tenants()[0];
    expect(tenant.name).toBe('Location Center');
    expect(tenant.fullName).toBe('Location Owner');
    expect(tenant.status).toBe('Active');
    expect(tenant.plan).toBe('Professional');
  });


  it('maps the Subscription column display source to trial vs production only', async () => {
    const loadPromise = service.loadFromBackend();
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant-catalog/tenants`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'tenant-1',
        centerName: 'Bright Center',
        tenantType: 'CENTER',
        subdomain: 'bright-center',
        domain: 'bright-center.example.com',
        industry: 'Education',
        contactName: 'Owner Name',
        contactEmail: 'owner@example.com',
        contactPhone: '01000000000',
        planName: 'Professional',
        isTrial: false,
        subscriptionState: 'expired',
        subscriptionType: null,
        createdBy: 'system',
        providerPaymentStatus: 'failed',
        tenantOperationalStatus: 'suspended',
        settlementStatus: 'failed',
        ownerDisplayStatus: 'suspended',
        createdAt: '2026-05-24T10:30:00Z',
      },
    ]);

    await loadPromise;

    const tenant = service.tenants()[0];
    expect(tenant.subscriptionState).toBe('expired');
    expect(tenant.subscriptionType).toBe('production');
  });
});
