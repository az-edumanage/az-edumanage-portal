import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantStudentCreatePayload } from '../models/tenant-student-create.models';
import { TenantStudentCreateDataService } from './tenant-student-create-data.service';

describe('TenantStudentCreateDataService', () => {
  let service: TenantStudentCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TenantStudentCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('submits enrollment payload with student credentials, selected parent, and without barcodeNumber', () => {
    service.enrollStudent(createPayload()).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    expect(request.request.method).toBe('POST');
    expect('barcodeNumber' in request.request.body).toBe(false);
    expect(request.request.body.username).toBe('student.alpha');
    expect(request.request.body.password).toBe('Student123!');
    expect(request.request.body.parentAppUserId).toBe('parent-user-1');
    expect('parentUsername' in request.request.body).toBe(false);
    expect('parentPassword' in request.request.body).toBe(false);
    expect('address' in request.request.body).toBe(false);
    request.flush({
      id: 'student-1',
      barcodeNumber: '123456789012',
    });
  });

  it('submits blank student email as null', () => {
    service.enrollStudent({ ...createPayload(), email: '   ' }).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.email).toBeNull();
    request.flush({
      id: 'student-optional-email',
      barcodeNumber: '123456789013',
    });
  });

  it('submits blank student phone as null', () => {
    service.enrollStudent({ ...createPayload(), phone: '   ' }).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.phone).toBeNull();
    request.flush({
      id: 'student-optional-phone',
      barcodeNumber: '123456789014',
    });
  });

  it('ignores backend barcodeNumber while completing enrollment', () => {
    service.enrollStudent(createPayload()).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/students'));
    request.flush({
      id: 'student-2',
      barcodeNumber: '987654321098',
    });
  });

});

function createPayload(): TenantStudentCreatePayload {
  return {
    fullName: 'Student Alpha',
    email: 'student.alpha@example.com',
    phone: '+201000000000',
    username: 'student.alpha',
    password: 'Student123!',
    birthDate: '2008-01-10',
    gender: 'Male',
    parentAppUserId: 'parent-user-1',
    notifyParent: true,
    educationCategory: 'BASIC_EDUCATION',
    stageIds: ['stage-1'],
    gradeIds: ['grade-1'],
    universityIds: [],
    collegeIds: [],
  };
}
