import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TenantGroupStudentAddDataService } from './tenant-group-student-add-data.service';

describe('TenantGroupStudentAddDataService', () => {
  let service: TenantGroupStudentAddDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantGroupStudentAddDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads eligible students for a group from the backend', () => {
    const actual = service.loadEligibleStudents('group-123').subscribe((students) => {
      expect(students).toEqual([
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          grade: 'Grade 12',
        },
      ]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/eligible-students`);
    expect(request.request.method).toBe('GET');
    request.flush({
      groupId: 'group-123',
      educationCategory: 'BASIC_EDUCATION',
      students: [
        {
          id: 'student-1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          grade: 'Grade 12',
        },
      ],
    });

    actual.unsubscribe();
  });

  it('maps empty eligible student arrays without seeded candidates', () => {
    const actual = service.loadEligibleStudents('group-empty').subscribe((students) => {
      expect(students).toEqual([]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-empty/eligible-students`);
    expect(request.request.method).toBe('GET');
    request.flush({
      groupId: 'group-empty',
      educationCategory: 'BASIC_EDUCATION',
      students: [],
    });

    actual.unsubscribe();
  });

  it('filters loaded candidates locally by name, email, or id', () => {
    const students = [
      { id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
      { id: 'student-2', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
    ];

    expect(service.searchStudents('sara', students)).toEqual([students[1]]);
    expect(service.searchStudents('student-1', students)).toEqual([students[0]]);
    expect(service.searchStudents('', students)).toEqual(students);
  });

  it('posts selected student ids to the group enrollment endpoint', () => {
    const payload = {
      enrollDate: '2026-06-02',
      discount: 0,
      sendNotification: true,
      generateInitialInvoice: true,
      studentIds: ['student-1', 'student-2'],
    };
    const actual = service.enrollStudentsToGroup('group-123', payload).subscribe((result) => {
      expect(result.enrolledStudentIds).toEqual(['student-1', 'student-2']);
      expect(result.skippedStudentIds).toEqual([]);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-123/enrollments`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      groupId: 'group-123',
      enrolledStudentIds: ['student-1', 'student-2'],
      skippedStudentIds: [],
    });

    actual.unsubscribe();
  });
});
