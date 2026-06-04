import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from '../auth/auth-api.service';
import { LocationSettingsService } from './location-settings.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

describe('LocationSettingsService', () => {
  let service: LocationSettingsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiMock },
      ],
    });

    service = TestBed.inject(LocationSettingsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads countries with activeOnly flag', async () => {
    const promise = service.listCountries(true);
    await Promise.resolve();

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/platform-settings/countries') && req.params.get('activeOnly') === 'true',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', active: true, sortOrder: 1 }]);

    await expect(promise).resolves.toEqual([
      { id: 1, code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', active: true, sortOrder: 1 },
    ]);
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('creates, updates, and deletes countries', async () => {
    const payload = { code: 'EG', nameEn: 'Egypt', nameAr: null, active: true, sortOrder: 0 };

    const createPromise = service.createCountry(payload);
    await Promise.resolve();
    const createRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/countries'));
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush({ id: 1, ...payload });
    await expect(createPromise).resolves.toEqual({ id: 1, ...payload });

    const updatePromise = service.updateCountry(1, { ...payload, nameEn: 'Egypt Updated' });
    await Promise.resolve();
    const updateRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/countries/1'));
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({ id: 1, ...payload, nameEn: 'Egypt Updated' });
    await expect(updatePromise).resolves.toMatchObject({ nameEn: 'Egypt Updated' });

    const deletePromise = service.deleteCountry(1);
    await Promise.resolve();
    const deleteRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/countries/1'));
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('loads cities for a country with activeOnly flag', async () => {
    const promise = service.listCities(1, true);
    await Promise.resolve();

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/platform-settings/countries/1/cities') && req.params.get('activeOnly') === 'true',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 10, countryId: 1, nameEn: 'Cairo', nameAr: 'القاهرة', active: true, sortOrder: 1 }]);

    await expect(promise).resolves.toEqual([
      { id: 10, countryId: 1, nameEn: 'Cairo', nameAr: 'القاهرة', active: true, sortOrder: 1 },
    ]);
  });

  it('creates, updates, and deletes cities', async () => {
    const payload = { countryId: 1, nameEn: 'Cairo', nameAr: null, active: true, sortOrder: 0 };

    const createPromise = service.createCity(1, payload);
    await Promise.resolve();
    const createRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/countries/1/cities'));
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush({ id: 10, ...payload });
    await expect(createPromise).resolves.toEqual({ id: 10, ...payload });

    const updatePromise = service.updateCity(10, { ...payload, nameEn: 'Cairo Updated' });
    await Promise.resolve();
    const updateRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/cities/10'));
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({ id: 10, ...payload, nameEn: 'Cairo Updated' });
    await expect(updatePromise).resolves.toMatchObject({ nameEn: 'Cairo Updated' });

    const deletePromise = service.deleteCity(10);
    await Promise.resolve();
    const deleteRequest = httpTesting.expectOne((req) => req.url.endsWith('/platform-settings/cities/10'));
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await expect(deletePromise).resolves.toBeUndefined();
  });
});
