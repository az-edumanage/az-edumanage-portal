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

  it('changes the tenant dashboard password through the owner endpoint', async () => {
    const passwordPromise = service.changeTenantPassword('tenant-1', 'NewPassword123', 'NewPassword123');
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/owner/tenants/tenant-1/password`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });
    request.flush({ tenantId: 'tenant-1', username: 'bright-admin', passwordChanged: true });

    await expect(passwordPromise).resolves.toEqual({
      tenantId: 'tenant-1',
      username: 'bright-admin',
      passwordChanged: true,
    });
  });

  it('loads assignable owner plans with audience and lifecycle metadata', async () => {
    const plansPromise = service.loadPlanOptions();
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/plan-catalog/plans`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'plan-center',
        name: 'Center Standard',
        audienceType: 'center',
        status: 'Active',
        monthlyPrice: 500,
        yearlyPrice: 5000,
        currency: 'EGP',
      },
      {
        id: 'plan-trial',
        name: 'SYSTEM_FREE_TRIAL',
        audienceType: 'teacher',
        status: 'Active',
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'EGP',
      },
    ]);

    await plansPromise;
    expect(service.planOptions()).toEqual([
      expect.objectContaining({ id: 'plan-center', audienceType: 'center', trialPlan: false }),
      expect.objectContaining({ id: 'plan-trial', audienceType: 'teacher', trialPlan: true }),
    ]);
  });

  it('changes the persisted tenant plan and maps trial to production response state', async () => {
    service.tenants.set([]);
    const changePromise = service.changeTenantPlan('tenant-1', 'plan-production');
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/owner/tenants/tenant-1/plan`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ planId: 'plan-production' });
    request.flush({
      id: 'tenant-1',
      centerName: 'Bright Center',
      tenantType: 'CENTER',
      subdomain: 'bright-center',
      domain: 'bright-center.example.com',
      contactName: 'Owner Name',
      contactEmail: 'owner@example.com',
      contactPhone: '01000000000',
      planName: 'Professional',
      isTrial: false,
      subscriptionState: 'production',
      subscriptionType: 'production',
      providerPaymentStatus: 'pending',
      tenantOperationalStatus: 'active',
      settlementStatus: 'unpaid',
      ownerDisplayStatus: 'active',
      createdAt: '2026-05-24T10:30:00Z',
    });

    const updated = await changePromise;
    expect(updated.plan).toBe('Professional');
    expect(updated.subscriptionType).toBe('production');
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
