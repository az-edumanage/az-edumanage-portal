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

  it('loads teacher status summary', () => {
    service.statusSummary().subscribe((summary) => {
      expect(summary.totalTeachers).toBe(5);
      expect(summary.inGroupNowTeacherIds).toEqual(['teacher-1']);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers/status-summary'));
    expect(request.request.method).toBe('GET');
    request.flush({
      totalTeachers: 5,
      inGroupNow: 1,
      absenceTeachers: 0,
      inGroupNowTeacherIds: ['teacher-1'],
      absenceTeacherIds: [],
      today: '2026-06-29',
      asOf: '2026-06-29T13:30:00+03:00',
      unavailableReason: null,
    });
  });

  it('loads teacher capacity without allowing a cached response', () => {
    service.capacity().subscribe((capacity) => {
      expect(capacity.tenantType).toBe('TEACHER');
      expect(capacity.canCreate).toBe(false);
    });

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/tenant/teachers/capacity') && req.params.has('_'));
    expect(request.request.method).toBe('GET');
    request.flush({
      tenantType: 'TEACHER',
      currentTeachers: 1,
      maxTeachers: 1,
      canCreate: false,
    });
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
