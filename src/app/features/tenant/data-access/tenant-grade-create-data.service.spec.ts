import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantCountrySettingsService } from './tenant-country-settings.service';
import { TenantGradeCreateDataService } from './tenant-grade-create-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

const countryServiceMock = {
  listCountries: vi.fn().mockResolvedValue([
    { id: 'country-1', name: 'Egypt', code: 'EG', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ]),
};

describe('TenantGradeCreateDataService', () => {
  let service: TenantGradeCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    countryServiceMock.listCountries.mockResolvedValue([
      { id: 'country-1', name: 'Egypt', code: 'EG', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: TenantCountrySettingsService, useValue: countryServiceMock },
      ],
    });

    service = TestBed.inject(TenantGradeCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads country options from tenant countries', async () => {
    await expect(service.listCountryOptions()).resolves.toEqual([
      { value: 'country-1', label: 'Egypt', code: 'EG' },
    ]);
  });

  it('loads academic levels filtered by country', async () => {
    const promise = service.listAcademicLevelOptions('country-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/tenant/platform-settings/stages') && req.params.get('countryId') === 'country-1',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'stage-1',
        name: 'Secondary',
        code: 'SEC',
        description: 'Secondary stage',
        status: 'Active',
        order: 1,
        countryId: 'country-1',
        country: 'Egypt',
        countryCode: 'EG',
        gradeCount: 0,
        classCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    await expect(promise).resolves.toEqual([
      { value: 'stage-1', label: 'Secondary', countryId: 'country-1' },
    ]);
  });

  it('creates tenant grades through the backend', async () => {
    const promise = service.createGrade({
      name: '  Grade 10  ',
      countryId: 'country-1',
      stageId: 'stage-1',
      description: '  First secondary grade  ',
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Grade 10',
      countryId: 'country-1',
      stageId: 'stage-1',
      description: 'First secondary grade',
    });
    request.flush(gradeResponse());

    await expect(promise).resolves.toMatchObject({ id: 'grade-1', name: 'Grade 10' });
  });

  it('loads a tenant grade by id for edit mode', async () => {
    const promise = service.getGrade('grade-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    expect(request.request.method).toBe('GET');
    request.flush(gradeResponse());

    await expect(promise).resolves.toMatchObject({ id: 'grade-1', name: 'Grade 10' });
  });

  it('updates tenant grades through the backend with trimmed payloads', async () => {
    const promise = service.updateGrade('grade-1', {
      name: '  Grade 11  ',
      countryId: 'country-1',
      stageId: 'stage-1',
      description: '  Updated description  ',
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Grade 11',
      countryId: 'country-1',
      stageId: 'stage-1',
      description: 'Updated description',
    });
    request.flush({ ...gradeResponse(), name: 'Grade 11', description: 'Updated description' });

    await expect(promise).resolves.toMatchObject({ id: 'grade-1', name: 'Grade 11' });
  });

  it('maps backend validation details to user-facing messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { details: ['Academic level must belong to the selected country'] },
    });

    expect(service.toUserMessage(error)).toBe('Academic level must belong to the selected country');
  });
});

function gradeResponse() {
  return {
    id: 'grade-1',
    name: 'Grade 10',
    description: 'First secondary grade',
    level: 'Secondary',
    stageId: 'stage-1',
    countryId: 'country-1',
    country: 'Egypt',
    countryCode: 'EG',
    studentCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
  };
}
