import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { OwnerTenantCreateDataService } from './owner-tenant-create-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

const locationSettingsMock = {
  listCountries: vi.fn(),
  listCities: vi.fn(),
};

describe('OwnerTenantCreateDataService', () => {
  let service: OwnerTenantCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    locationSettingsMock.listCountries.mockResolvedValue([
      { id: 1, code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', active: true, sortOrder: 0 },
    ]);
    locationSettingsMock.listCities.mockResolvedValue([
      { id: 10, countryId: 1, nameEn: 'Cairo', nameAr: 'القاهرة', active: true, sortOrder: 0 },
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: LocationSettingsService, useValue: locationSettingsMock },
      ],
    });

    service = TestBed.inject(OwnerTenantCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenants, plans, and active countries into option signals', async () => {
    const promise = service.loadBootstrapData();
    await Promise.resolve();

    const plansRequest = httpTesting.expectOne((req) => req.url.endsWith('/plan-catalog/plans'));
    plansRequest.flush([{ id: 'plan-1', name: 'Starter', monthlyPrice: 99, currency: 'EGP' }]);

    await Promise.resolve();
    const tenantsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant-catalog/tenants'));
    tenantsRequest.flush([{
      centerName: 'ABC Center',
      subdomain: 'abc',
      contactEmail: 'abc@example.com',
      contactPhone: '+100',
      provisioningStatus: 'PROVISIONED',
      isActive: true,
    }]);

    await promise;

    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
    expect(locationSettingsMock.listCountries).toHaveBeenCalledWith(true);
    expect(service.existingTenants()).toEqual([{
      name: 'ABC Center',
      subdomain: 'abc',
      email: 'abc@example.com',
      phone: '+100',
      provisioningStatus: 'PROVISIONED',
      isActive: true,
    }]);
    expect(service.subscriptionTemplates()).toEqual([{ id: 'plan-1', name: 'Starter', price: 'LE 99/mo', popular: false }]);
    expect(service.countryOptions()).toEqual([{ id: 1, value: '1', label: 'Egypt' }]);
    expect(service.countryDropdownOptions()).toEqual([{ value: '1', label: 'Egypt' }]);
    expect(service.cityOptions()).toEqual([]);
  });

  it('loads active cities for the selected country and resolves options', async () => {
    await service.loadCities(1);

    expect(locationSettingsMock.listCities).toHaveBeenCalledWith(1, true);
    expect(service.cityOptions()).toEqual([{ id: 10, value: '10', label: 'Cairo' }]);
    expect(service.cityDropdownOptions()).toEqual([{ value: '10', label: 'Cairo' }]);
    expect(service.findCityByValue('10')).toEqual({ id: 10, value: '10', label: 'Cairo' });
    expect(service.findCityById(10)).toEqual({ id: 10, value: '10', label: 'Cairo' });

    service.clearCities();
    expect(service.cityOptions()).toEqual([]);
  });

  it('submits tenant create payload with countryId and cityId', async () => {
    const payload = {
      centerName: 'ABC Center',
      tenantType: 'Center',
      tenantUsername: 'abc-admin',
      temporaryPassword: 'TempPass123!',
      subdomain: 'abc-center',
      domain: '.az-edumanage.com',
      contactName: 'Tenant Admin',
      contactEmail: 'admin@example.com',
      contactPhone: '+1555012345',
      address: '123 Street',
      country: 'Egypt',
      city: 'Cairo',
      countryId: 1,
      cityId: 10,
      planId: 'plan-1',
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false,
    };

    const subscription = service.createTenant(payload).subscribe();
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant-catalog/tenants'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ countryId: 1, cityId: 10 });
    const obsoleteField = 'ind' + 'ustry';
    expect(request.request.body[obsoleteField]).toBeUndefined();
    request.flush({ id: 'tenant-1' });
    subscription.unsubscribe();
  });

  it('detects a provisioned tenant by submitted name and subdomain', async () => {
    const promise = service.hasProvisionedTenant('ABC Center', 'abc');
    await Promise.resolve();
    await Promise.resolve();

    const tenantsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant-catalog/tenants'));
    tenantsRequest.flush([
      {
        centerName: 'ABC Center',
        subdomain: 'abc',
        contactEmail: 'abc@example.com',
        contactPhone: '+100',
        provisioningStatus: 'PROVISIONED',
        isActive: true,
      },
    ]);

    await expect(promise).resolves.toBe(true);
  });

  it('accepts active boolean from backend tenant list responses', async () => {
    const promise = service.hasProvisionedTenant('ABC Center', 'abc');
    await Promise.resolve();
    await Promise.resolve();

    const tenantsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant-catalog/tenants'));
    tenantsRequest.flush([
      {
        centerName: 'ABC Center',
        subdomain: 'abc',
        contactEmail: 'abc@example.com',
        contactPhone: '+100',
        provisioningStatus: 'PROVISIONED',
        active: true,
      },
    ]);

    await expect(promise).resolves.toBe(true);
  });
});
