import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StudentRegistrationDataService } from './student-registration-data.service';

describe('StudentRegistrationDataService', () => {
  let service: StudentRegistrationDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(StudentRegistrationDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an expiring tenant registration link', async () => {
    const expiresAt = '2026-07-19T12:00:00.000Z';
    const promise = firstValueFrom(service.createLink(expiresAt));
    const request = http.expectOne(`${environment.apiBaseUrl}/tenant/student-registrations/links`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ expiresAt });
    request.flush({ id: 'link-1', token: 'secret', expiresAt, revokedAt: null, createdAt: '2026-07-18T12:00:00Z', active: true });
    expect((await promise).token).toBe('secret');
  });

  it('submits a public registration without an authorization-specific endpoint', async () => {
    const payload = {
      fullName: 'Student One', email: '', phone: '', username: 'student.one', password: 'Password1!',
      gender: 'Male', birthDate: '2010-01-01', parentName: '', parentPhone: '',
      educationCategory: 'BASIC_EDUCATION', stageId: 'stage-1', gradeId: 'grade-1',
      universityId: null, collegeId: null,
    };
    const promise = firstValueFrom(service.submitPublicForm('public-token', payload));
    const request = http.expectOne(`${environment.apiBaseUrl}/public/student-registration/public-token`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ requestId: 'request-1', status: 'PENDING', message: 'Submitted' });
    expect((await promise).status).toBe('PENDING');
  });
});
