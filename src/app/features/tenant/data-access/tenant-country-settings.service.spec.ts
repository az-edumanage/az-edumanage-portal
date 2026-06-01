import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantCountrySettingsService } from './tenant-country-settings.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

describe('TenantCountrySettingsService', () => {
  let service: TenantCountrySettingsService;
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

    service = TestBed.inject(TenantCountrySettingsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenant countries', async () => {
    const promise = service.listCountries();
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/countries'));
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'country-1', name: 'Egypt', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]);

    await expect(promise).resolves.toEqual([
      { id: 'country-1', name: 'Egypt', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('creates tenant countries with trimmed names', async () => {
    const promise = service.createCountry('  Morocco  ');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/countries'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Morocco' });
    request.flush({ id: 'country-2', name: 'Morocco', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' });

    await expect(promise).resolves.toMatchObject({ id: 'country-2', name: 'Morocco' });
  });

  it('updates tenant countries with trimmed names', async () => {
    const promise = service.updateCountry('country-1', '  Jordan  ');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/countries/country-1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Jordan' });
    request.flush({ id: 'country-1', name: 'Jordan', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' });

    await expect(promise).resolves.toMatchObject({ id: 'country-1', name: 'Jordan' });
  });

  it('deletes tenant countries', async () => {
    const promise = service.deleteCountry('country-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/countries/country-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('maps backend validation details to user-facing messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', details: ['Country name already exists'] },
    });

    expect(service.toUserMessage(error)).toBe('Country name already exists');
  });

  it('maps forbidden responses to the tenant country permission message', () => {
    const error = new HttpErrorResponse({ status: 403, error: {} });

    expect(service.toUserMessage(error)).toBe('You do not have permission to manage tenant countries.');
  });

  it('keeps a generic message for non-permission failures without api details', () => {
    const error = new HttpErrorResponse({ status: 500, error: {} });

    expect(service.toUserMessage(error)).toBe('Unable to save country. Please try again.');
  });
});
