import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantGradesDataService } from './tenant-grades-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

describe('TenantGradesDataService', () => {
  let service: TenantGradesDataService;
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

    service = TestBed.inject(TenantGradesDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenant grades from the backend', async () => {
    const promise = service.listGrades();
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades'));
    expect(request.request.method).toBe('GET');
    request.flush([gradeResponse()]);

    await expect(promise).resolves.toEqual([gradeResponse()]);
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('deletes tenant grades through the backend', async () => {
    const promise = service.deleteGrade('grade-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(promise).resolves.toBeUndefined();
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('maps forbidden errors to a tenant grades permission message', () => {
    const error = new HttpErrorResponse({ status: 403, error: {} });

    expect(service.toUserMessage(error)).toBe('You do not have permission to manage tenant grades.');
  });

  it('maps api validation details to user-facing messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { details: ['Grade name already exists for this academic level'] },
    });

    expect(service.toUserMessage(error)).toBe('Grade name already exists for this academic level');
  });

  it('maps delete errors through the delete fallback message', () => {
    const error = new HttpErrorResponse({ status: 500, error: {} });

    expect(service.toDeleteUserMessage(error)).toBe('Unable to delete grade. Please try again.');
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
