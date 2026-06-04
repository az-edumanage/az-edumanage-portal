import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantGroupCreateApiPayload } from '../models/tenant-group-create.models';
import { TenantGroupCreateDataService } from './tenant-group-create-data.service';

describe('TenantGroupCreateDataService', () => {
  let service: TenantGroupCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TenantGroupCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads group create options from the backend', () => {
    service.loadCreateOptions().subscribe((options) => {
      expect(options.owners[0].id).toBe('owner-1');
      expect(options.stages[0].name).toBe('Secondary');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/create-options'));
    expect(request.request.method).toBe('GET');
    request.flush({
      owners: [{ id: 'owner-1', name: 'Center' }],
      teachers: [{ id: 'teacher-1', name: 'Sarah Nabil' }],
      stages: [{ id: 'stage-1', name: 'Secondary' }],
      grades: [{ id: 'grade-1', name: 'Grade 12', parentId: 'stage-1' }],
      universities: [],
      colleges: [],
      rooms: [],
    });
  });

  it('loads filtered Basic Education subjects and assigned teachers', () => {
    service.loadSubjects({
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      gradeId: 'grade-1',
    }).subscribe();

    const subjectsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/subjects'));
    expect(subjectsRequest.request.params.get('educationCategory')).toBe('BASIC_EDUCATION');
    expect(subjectsRequest.request.params.get('stageId')).toBe('stage-1');
    expect(subjectsRequest.request.params.get('gradeId')).toBe('grade-1');
    subjectsRequest.flush([]);

    service.loadAssignedTeachers({
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
    }).subscribe();

    const teachersRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/assigned-teachers'));
    expect(teachersRequest.request.params.get('subjectId')).toBe('subject-1');
    teachersRequest.flush([]);
  });

  it('loads filtered University Education subjects and assigned teachers', () => {
    service.loadSubjects({
      educationCategory: 'UNIVERSITY_EDUCATION',
      universityId: 'university-1',
      collegeId: 'college-1',
    }).subscribe();

    const subjectsRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/subjects'));
    expect(subjectsRequest.request.params.get('educationCategory')).toBe('UNIVERSITY_EDUCATION');
    expect(subjectsRequest.request.params.get('universityId')).toBe('university-1');
    expect(subjectsRequest.request.params.get('collegeId')).toBe('college-1');
    subjectsRequest.flush([]);

    service.loadAssignedTeachers({
      educationCategory: 'UNIVERSITY_EDUCATION',
      universityId: 'university-1',
      collegeId: 'college-1',
      universitySubjectId: 'subject-1',
    }).subscribe();

    const teachersRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/assigned-teachers'));
    expect(teachersRequest.request.params.get('educationCategory')).toBe('UNIVERSITY_EDUCATION');
    expect(teachersRequest.request.params.get('universityId')).toBe('university-1');
    expect(teachersRequest.request.params.get('collegeId')).toBe('college-1');
    expect(teachersRequest.request.params.get('universitySubjectId')).toBe('subject-1');
    teachersRequest.flush([]);
  });

  it('loads teacher academic classification options', () => {
    service.loadTeacherClassification({
      educationCategory: 'BASIC_EDUCATION',
      teacherId: 'teacher-1',
    }).subscribe((options) => {
      expect(options.subjects[0].name).toBe('Physics');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/teacher-classification'));
    expect(request.request.params.get('educationCategory')).toBe('BASIC_EDUCATION');
    expect(request.request.params.get('teacherId')).toBe('teacher-1');
    request.flush({
      stages: [],
      grades: [],
      universities: [],
      colleges: [],
      subjects: [{ id: 'subject-1', name: 'Physics' }],
    });
  });

  it('loads teacher availability with optional edit exclusion', () => {
    service.loadTeacherAvailability('teacher-1', 'group-1').subscribe((availability) => {
      expect(availability.teacherId).toBe('teacher-1');
      expect(availability.unavailableRanges[0].startTime).toBe('10:30');
      expect(availability.unavailableRanges[0].endTime).toBe('11:30');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/teacher-availability'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('teacherId')).toBe('teacher-1');
    expect(request.request.params.get('excludeGroupId')).toBe('group-1');
    request.flush({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'existing-group',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '10:30',
        endTime: '11:30',
        duration: 60,
      }],
    });
  });

  it('preserves partial-hour teacher availability ranges from the backend', () => {
    service.loadTeacherAvailability('teacher-1').subscribe((availability) => {
      expect(availability.unavailableRanges[0]).toEqual(expect.objectContaining({
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        duration: 60,
      }));
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/teacher-availability'));
    expect(request.request.params.get('teacherId')).toBe('teacher-1');
    request.flush({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'existing-group',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        duration: 60,
      }],
    });
  });

  it('loads teacher availability without edit exclusion and propagates backend errors', () => {
    service.loadTeacherAvailability('teacher-1').subscribe({
      next: () => {
        throw new Error('expected availability load to fail');
      },
      error: (error: Error) => {
        expect(error.message).toBe('Assigned teacher not found');
      },
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/teacher-availability'));
    expect(request.request.params.get('teacherId')).toBe('teacher-1');
    expect(request.request.params.has('excludeGroupId')).toBeFalsy();
    request.flush({ message: 'Assigned teacher not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('loads room availability with optional edit exclusion', () => {
    service.loadRoomAvailability('group-1').subscribe((availability) => {
      expect(availability.unavailableRanges[0].roomId).toBe('room-1');
      expect(availability.unavailableRanges[0].startTime).toBe('13:00');
      expect(availability.unavailableRanges[0].endTime).toBe('14:30');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/room-availability'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('excludeGroupId')).toBe('group-1');
    request.flush({
      unavailableRanges: [{
        groupId: 'existing-group',
        groupName: 'Physics G12-A',
        roomId: 'room-1',
        roomName: 'Room A',
        day: 'Sunday',
        startTime: '13:00',
        endTime: '14:30',
        duration: 90,
      }],
    });
  });

  it('loads room availability without edit exclusion and propagates backend errors', () => {
    service.loadRoomAvailability().subscribe({
      next: () => {
        throw new Error('expected room availability load to fail');
      },
      error: (error: Error) => {
        expect(error.message).toBe('Unable to load rooms');
      },
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/room-availability'));
    expect(request.request.params.has('excludeGroupId')).toBeFalsy();
    request.flush({ message: 'Unable to load rooms' }, { status: 500, statusText: 'Server Error' });
  });

  it('loads selected group edit values from the backend', () => {
    service.loadGroupForEdit('group-1').subscribe((group) => {
      expect(group.id).toBe('group-1');
      expect(group.name).toBe('Physics G12-A');
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/group-1/edit'));
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'group-1',
      name: 'Physics G12-A',
      pricePerStudent: 500,
      ownedByAppUserId: 'owner-1',
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
      universityId: null,
      collegeId: null,
      universitySubjectId: null,
      assignedTeacherId: 'teacher-1',
      roomId: 'room-1',
      capacity: 25,
      isFixedTime: true,
      startTime: '10:00',
      duration: 90,
      daySchedules: {},
      scheduleDays: ['Monday'],
      autoInvoice: true,
      allowSelfEnroll: false,
      hasSpecificDuration: false,
      startDate: null,
      endDate: null,
      requireApproval: true,
      isActive: true,
    });
  });

  it('extracts backend errors while loading selected group edit values', () => {
    service.loadGroupForEdit('group-1').subscribe({
      next: () => {
        throw new Error('expected edit load to fail');
      },
      error: (error: Error) => {
        expect(error.message).toBe('Group not found');
      },
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/group-1/edit'));
    request.flush({ message: 'Group not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('posts the group create payload to the backend and puts edit payloads to the selected group', () => {
    const payload: TenantGroupCreateApiPayload = {
      name: 'Physics G12-A',
      pricePerStudent: 500,
      ownedByAppUserId: 'owner-1',
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
      universityId: null,
      collegeId: null,
      universitySubjectId: null,
      assignedTeacherId: 'teacher-1',
      roomId: 'room-1',
      capacity: 25,
      isFixedTime: true,
      startTime: '10:00',
      duration: 90,
      daySchedules: {},
      scheduleDays: ['Monday'],
      autoInvoice: true,
      allowSelfEnroll: false,
      hasSpecificDuration: false,
      startDate: null,
      endDate: null,
      requireApproval: true,
      isActive: true,
    };

    service.createOrUpdateGroup(payload).subscribe();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(expect.objectContaining({
      name: 'Physics G12-A',
      pricePerStudent: 500,
      ownedByAppUserId: 'owner-1',
    }));
    request.flush({ id: 'group-1' });

    service.createOrUpdateGroup(payload, 'group-1').subscribe();

    const editRequest = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/group-1'));
    expect(editRequest.request.method).toBe('PUT');
    expect(editRequest.request.body).toEqual(expect.objectContaining({
      name: 'Physics G12-A',
      pricePerStudent: 500,
      ownedByAppUserId: 'owner-1',
    }));
    editRequest.flush({ id: 'group-1' });
  });
});
