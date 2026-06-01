import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantSubjectsDataService } from './tenant-subjects-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

describe('TenantSubjectsDataService', () => {
  let service: TenantSubjectsDataService;
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

    service = TestBed.inject(TenantSubjectsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenant subjects from the backend', async () => {
    const promise = service.listSubjects({ stageId: 'stage-1', gradeId: 'grade-1', search: 'math' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('stageId')).toBe('stage-1');
    expect(request.request.params.get('gradeId')).toBe('grade-1');
    expect(request.request.params.get('search')).toBe('math');
    request.flush([subjectResponse()]);

    await expect(promise).resolves.toEqual([subjectResponse()]);
  });

  it('creates tenant subjects through the backend', async () => {
    const promise = service.createSubject({ name: ' Mathematics ', stageId: 'stage-1', gradeId: 'grade-1' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Mathematics', stageId: 'stage-1', gradeId: 'grade-1' });
    request.flush(subjectResponse());

    await expect(promise).resolves.toEqual(subjectResponse());
  });

  it('loads subject details and normalizes missing groups', async () => {
    const promise = service.getSubjectDetails('subject-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects/subject-1'));
    expect(request.request.method).toBe('GET');
    request.flush({ ...subjectResponse(), groups: null });

    await expect(promise).resolves.toEqual({ ...subjectResponse(), groups: [] });
  });

  it('loads stage and grade selector options', async () => {
    const stagesPromise = service.listStageOptions();
    await Promise.resolve();
    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages')).flush([
      { id: 'stage-1', name: 'Secondary' },
    ]);

    const gradesPromise = service.listGradeOptions();
    await Promise.resolve();
    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades')).flush([
      { id: 'grade-1', name: 'Grade 10', stageId: 'stage-1' },
    ]);

    await expect(stagesPromise).resolves.toEqual([{ value: 'stage-1', label: 'Secondary' }]);
    await expect(gradesPromise).resolves.toEqual([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
  });

  it('maps forbidden errors to a tenant subjects permission message', () => {
    const error = new HttpErrorResponse({ status: 403, error: {} });

    expect(service.toUserMessage(error)).toBe('You do not have permission to manage tenant subjects.');
  });
});

function subjectResponse() {
  return {
    id: 'subject-1',
    name: 'Mathematics',
    stageId: 'stage-1',
    stageName: 'Secondary',
    gradeId: 'grade-1',
    gradeName: 'Grade 10',
    assignedGroupsCount: 0,
    totalStudentsCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
  };
}
