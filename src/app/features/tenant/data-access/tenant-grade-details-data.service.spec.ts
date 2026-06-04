import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantGradesDataService } from './tenant-grades-data.service';
import { TenantGradeDetailsDataService } from './tenant-grade-details-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

const gradesDataMock = {
  toDetailUserMessage: vi.fn().mockReturnValue('Unable to load grade details. Please try again.'),
};

describe('TenantGradeDetailsDataService', () => {
  let service: TenantGradeDetailsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    gradesDataMock.toDetailUserMessage.mockReturnValue('Unable to load grade details. Please try again.');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: TenantGradesDataService, useValue: gradesDataMock },
      ],
    });

    service = TestBed.inject(TenantGradeDetailsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads a tenant grade by id from the backend', async () => {
    const promise = service.getGradeById('grade-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    expect(request.request.method).toBe('GET');
    request.flush(gradeResponse());

    await expect(promise).resolves.toEqual(gradeResponse());
    expect(authApiMock.ensureLoggedIn).toHaveBeenCalled();
  });

  it('keeps backend-provided linked groups on grade details', async () => {
    const promise = service.getGradeById('grade-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    request.flush({
      ...gradeResponse(),
      groups: [
        { id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null },
      ],
    });

    await expect(promise).resolves.toMatchObject({
      groups: [
        { id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null },
      ],
    });
  });

  it('defaults missing linked groups to an empty array', async () => {
    const promise = service.getGradeById('grade-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades/grade-1'));
    const { groups: _groups, ...responseWithoutGroups } = gradeResponse();
    request.flush(responseWithoutGroups);

    await expect(promise).resolves.toMatchObject({ groups: [] });
  });

  it('maps detail loading failures through the shared grade error mapper', () => {
    const error = new HttpErrorResponse({ status: 404, error: { message: 'Grade not found' } });
    gradesDataMock.toDetailUserMessage.mockReturnValue('Grade not found');

    expect(service.toUserMessage(error)).toBe('Grade not found');
    expect(gradesDataMock.toDetailUserMessage).toHaveBeenCalledWith(error);
  });

  it('maps forbidden detail failures through the shared grade error mapper', () => {
    const error = new HttpErrorResponse({ status: 403, error: {} });
    gradesDataMock.toDetailUserMessage.mockReturnValue('You do not have permission to manage tenant grades.');

    expect(service.toUserMessage(error)).toBe('You do not have permission to manage tenant grades.');
    expect(gradesDataMock.toDetailUserMessage).toHaveBeenCalledWith(error);
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
