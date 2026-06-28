import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantCountrySettingsService } from './tenant-country-settings.service';
import { TenantEducationalStagesDataService } from './tenant-educational-stages-data.service';

type StageResponse = {
  id: string;
  name: string;
  code: string | null;
  description: string;
  status: 'Active' | 'Inactive' | 'Draft';
  order: number;
  countryId: string;
  country: string;
  countryCode: string | null;
  gradeCount: number;
  classCount: number;
  createdAt: string;
  updatedAt: string;
};

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

const countryServiceMock = {
  listCountries: vi.fn().mockResolvedValue([
    { id: 'country-1', name: 'Egypt', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ]),
  createCountry: vi.fn().mockResolvedValue({ id: 'country-2', name: 'Morocco', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }),
  toUserMessage: vi.fn().mockReturnValue('Unable to save country. Please try again.'),
};

describe('TenantEducationalStagesDataService', () => {
  let service: TenantEducationalStagesDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    countryServiceMock.listCountries.mockResolvedValue([
      { id: 'country-1', name: 'Egypt', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]);
    countryServiceMock.createCountry.mockResolvedValue({ id: 'country-2', name: 'Morocco', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: TenantCountrySettingsService, useValue: countryServiceMock },
      ],
    });

    service = TestBed.inject(TenantEducationalStagesDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenant stages from the backend', async () => {
    const promise = service.listStages();
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages'));
    expect(request.request.method).toBe('GET');
    request.flush([
      stageResponse({ id: 'stage-1', name: 'Primary Stage', countryId: 'country-1', country: 'Egypt' }),
    ]);

    await expect(promise).resolves.toMatchObject([
      { id: 'stage-1', name: 'Primary Stage', countryId: 'country-1', country: 'Egypt' },
    ]);
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('loads country options from tenant countries', async () => {
    await expect(service.listCountryOptions()).resolves.toEqual([
      { value: 'country-1', label: 'Egypt', code: null },
    ]);
  });

  it('creates a country option through tenant countries', async () => {
    await expect(service.createCountryOption('  Morocco  ')).resolves.toEqual({ value: 'country-2', label: 'Morocco', code: null });

    expect(countryServiceMock.createCountry).toHaveBeenCalledWith('  Morocco  ');
  });

  it('creates tenant stages through the backend', async () => {
    const promise = service.createStage({ name: '  Primary Stage  ', description: '  New stage  ', countryId: 'country-1' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Primary Stage', description: 'New stage', countryId: 'country-1' });
    request.flush(stageResponse({ id: 'stage-1', name: 'Primary Stage', countryId: 'country-1', country: 'Egypt' }));

    await expect(promise).resolves.toMatchObject({ id: 'stage-1', name: 'Primary Stage' });
  });

  it('updates and deletes tenant stages through the backend', async () => {
    const updatePromise = service.updateStage('stage-1', { name: 'Preparatory', description: 'Updated', countryId: 'country-2' });
    await Promise.resolve();

    const update = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages/stage-1'));
    expect(update.request.method).toBe('PUT');
    update.flush(stageResponse({ id: 'stage-1', name: 'Preparatory', countryId: 'country-2', country: 'Jordan' }));
    await expect(updatePromise).resolves.toMatchObject({ name: 'Preparatory', countryId: 'country-2' });

    const deletePromise = service.deleteStage('stage-1');
    await Promise.resolve();

    const remove = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages/stage-1'));
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('maps backend validation details to user-facing messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', details: ['Stage name already exists for this country'] },
    });

    expect(service.toUserMessage(error)).toBe('Stage name already exists for this country');
  });
});

function stageResponse(overrides: Partial<StageResponse> = {}): StageResponse {
  return {
    id: 'stage-1',
    name: 'Primary Stage',
    code: 'PS',
    description: 'Description',
    status: 'Active',
    order: 1,
    countryId: 'country-1',
    country: 'Egypt',
    countryCode: null,
    gradeCount: 2,
    classCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
