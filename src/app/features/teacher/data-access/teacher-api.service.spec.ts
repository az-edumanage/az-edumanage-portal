import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TeacherApiService } from './teacher-api.service';

describe('TeacherApiService', () => {
  let service: TeacherApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads assigned groups from the teacher groups endpoint', () => {
    const groups = [{
      id: 'group-1',
      name: 'Grade 3 - A',
      subject: 'Math',
      educationCategory: 'BASIC_EDUCATION' as const,
      stage: 'Primary',
      grade: 'Grade 3',
      studentsCount: 15,
      schedule: 'Sun 17:00',
      room: 'Room 3',
      status: 'Active',
    }];

    service.loadAssignedGroups().subscribe((result) => {
      expect(result).toEqual(groups);
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/teacher/groups`);
    expect(request.request.method).toBe('GET');
    request.flush(groups);
  });

  it('loads teacher exam setup from the teacher exams endpoint', () => {
    const setup = [{
      id: 'assignment-1',
      name: 'Grade 3 - Math',
      subject: 'Math',
      educationCategory: 'BASIC_EDUCATION' as const,
      stage: 'Primary',
      grade: 'Grade 3',
      groupsCount: 2,
      studentsCount: 15,
      status: 'Active',
    }];

    service.loadExamSetup().subscribe((result) => {
      expect(result).toEqual(setup);
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/teacher/exams/setup`);
    expect(request.request.method).toBe('GET');
    request.flush(setup);
  });

  it('maps API errors to user-facing errors', () => {
    let message = '';
    service.loadAssignedGroups().subscribe({
      error: (error: Error) => {
        message = error.message;
      },
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/teacher/groups`);
    request.flush({ message: 'Teacher groups access required' }, { status: 403, statusText: 'Forbidden' });

    expect(message).toBe('Teacher groups access required');
  });
});
