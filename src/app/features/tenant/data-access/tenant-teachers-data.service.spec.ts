import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TenantTeachersDataService } from './tenant-teachers-data.service';

describe('TenantTeachersDataService', () => {
  let service: TenantTeachersDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantTeachersDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends delete teacher requests', () => {
    service.deleteTeacher('teacher-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers/teacher-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('sends exit group requests for a teacher', () => {
    service.exitTeacherGroup('teacher-1', 'group-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers/teacher-1/groups/group-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
