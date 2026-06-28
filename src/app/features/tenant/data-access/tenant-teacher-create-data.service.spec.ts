import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantTeacherCreateDataService } from './tenant-teacher-create-data.service';

describe('TenantTeacherCreateDataService', () => {
  let service: TenantTeacherCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TenantTeacherCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends university education assignments when creating a teacher', () => {
    service.createOrUpdateTeacher(defaultCreatePayload({
      educationCategory: 'UNIVERSITY_EDUCATION',
      stageIds: ['stage-1'],
      gradeIds: ['grade-1'],
      subjectIds: ['subject-1'],
      universityIds: ['university-1'],
      collegeIds: ['college-1'],
      universitySubjectIds: ['university-subject-1'],
    }), null).subscribe();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(expect.objectContaining({
      educationCategory: 'UNIVERSITY_EDUCATION',
      stageIds: [],
      gradeIds: [],
      subjectIds: [],
      universityIds: ['university-1'],
      collegeIds: ['college-1'],
      universitySubjectIds: ['university-subject-1'],
    }));
    request.flush(teacherResponse());
  });

  it('sends teacher login credentials and profile fields when creating a teacher', () => {
    service.createOrUpdateTeacher(defaultCreatePayload(), null).subscribe();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(expect.objectContaining({
      fullName: 'Teacher Alpha',
      email: 'teacher.alpha@example.com',
      phone: '+20 100 000 0000',
      username: 'teacher.alpha',
      password: 'Teacher123!',
      forcePasswordChange: true,
      educationCategory: 'BASIC_EDUCATION',
      stageIds: ['stage-1'],
      gradeIds: ['grade-1'],
      subjectIds: ['subject-1'],
      status: 'Active',
    }));
    request.flush(teacherResponse());
  });

  it('removes username password and force-password-change fields when editing a teacher', () => {
    service.createOrUpdateTeacher(defaultCreatePayload(), 'teacher-1').subscribe();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers/teacher-1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.username).toBeUndefined();
    expect(request.request.body.password).toBeUndefined();
    expect(request.request.body.forcePasswordChange).toBeUndefined();
    expect(request.request.body.fullName).toBe('Teacher Alpha');
    request.flush(teacherResponse());
  });

  it('surfaces duplicate username API errors as save errors', () => {
    let errorMessage = '';
    service.createOrUpdateTeacher(defaultCreatePayload(), null).subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers'));
    request.flush({ message: 'User name already exists' }, { status: 400, statusText: 'Bad Request' });

    expect(errorMessage).toBe('User name already exists');
  });

  it('maps returned university education assignments for editing', () => {
    service.getTeacherForEdit('teacher-1').subscribe((seed) => {
      expect(seed.educationCategory).toBe('UNIVERSITY_EDUCATION');
      expect(seed.universityIds).toEqual(['university-1']);
      expect(seed.collegeIds).toEqual(['college-1']);
      expect(seed.universitySubjectIds).toEqual(['university-subject-1']);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/teachers/teacher-1'));
    expect(request.request.method).toBe('GET');
    request.flush(teacherResponse());
  });
});

function defaultCreatePayload(overrides = {}) {
  return {
    fullName: 'Teacher Alpha',
    email: 'teacher.alpha@example.com',
    phone: '+20 100 000 0000',
    username: 'teacher.alpha',
    password: 'Teacher123!',
    forcePasswordChange: true,
    educationCategory: 'BASIC_EDUCATION' as const,
    stageIds: ['stage-1'],
    gradeIds: ['grade-1'],
    subjectIds: ['subject-1'],
    universityIds: [],
    collegeIds: [],
    universitySubjectIds: [],
    status: 'Active' as const,
    joinDate: '2026-05-31',
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
    documents: [],
    ...overrides,
  };
}

function teacherResponse() {
  return {
    id: 'teacher-1',
    fullName: 'Teacher Alpha',
    name: 'Teacher Alpha',
    email: 'teacher.alpha@example.com',
    phone: '+20 100 000 0000',
    username: 'teacher.alpha',
    educationCategory: 'UNIVERSITY_EDUCATION',
    subject: 'Circuits',
    subjects: [],
    universitySubjects: [
      { id: 'university-subject-1', name: 'Circuits', universityId: 'university-1', collegeId: 'college-1' },
    ],
    status: 'Active',
    joinDate: '2026-05-31',
    documents: [],
    stageIds: [],
    gradeIds: [],
    subjectIds: [],
    universityIds: ['university-1'],
    collegeIds: ['college-1'],
    universitySubjectIds: ['university-subject-1'],
    groups: [],
    tenantBound: true,
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
    createdAt: '2026-05-31T00:00:00Z',
    updatedAt: '2026-05-31T00:00:00Z',
  };
}
