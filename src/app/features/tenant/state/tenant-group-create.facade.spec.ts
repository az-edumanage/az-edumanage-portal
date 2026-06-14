import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupCreateDataService } from '../data-access/tenant-group-create-data.service';
import {
  TenantGroupCreateApiPayload,
  TenantGroupCreateOptions,
  TenantGroupEditApiPayload,
  TenantGroupSelectorOption,
  TenantGroupTeacherClassificationOptions,
} from '../models/tenant-group-create.models';
import { TenantGroupCreateFacade } from './tenant-group-create.facade';
import { TenantGroupCreateStore } from './tenant-group-create.store';

describe('TenantGroupCreateFacade', () => {
  let facade: TenantGroupCreateFacade;
  let store: TenantGroupCreateStore;
  let teacherClassificationCalls: unknown[];
  let assignedTeacherCalls: unknown[];
  let editLoadCalls: string[];
  let submitCalls: { payload: TenantGroupCreateApiPayload; groupId?: string | null }[];
  let createOptionsResponse: TenantGroupCreateOptions;
  let editPayload: TenantGroupEditApiPayload;
  let subjectsResponse: TenantGroupSelectorOption[];
  let teacherClassificationResponse: TenantGroupTeacherClassificationOptions = {
    stages: [],
    grades: [],
    universities: [],
    colleges: [],
    subjects: [],
  };
  let assignedTeachersResponse: TenantGroupSelectorOption[] = [];
  let taskServiceMock: {
    getTask: ReturnType<typeof vi.fn>;
    removeTask: ReturnType<typeof vi.fn>;
    addTask: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    teacherClassificationCalls = [];
    assignedTeacherCalls = [];
    editLoadCalls = [];
    submitCalls = [];
    createOptionsResponse = {
      owners: [{ id: 'owner-1', name: 'Tenant Admin', subtitle: 'TENANT_ADMIN' }],
      teachers: [
        { id: 'teacher-1', name: 'Sarah Nabil', educationCategory: 'BASIC_EDUCATION' },
        { id: 'teacher-2', name: 'Omar Adel', educationCategory: 'UNIVERSITY_EDUCATION' },
      ],
      stages: [{ id: 'stage-1', name: 'Secondary' }],
      grades: [{ id: 'grade-1', name: 'Grade 12', parentId: 'stage-1' }],
      universities: [{ id: 'university-1', name: 'Cairo University' }],
      colleges: [{ id: 'college-1', name: 'Engineering', parentId: 'university-1' }],
      rooms: [
        { id: 'room-1', name: 'Lab 101' },
        { id: 'room-2', name: 'Lab 102' },
      ],
    };
    subjectsResponse = [{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }];
    editPayload = {
      id: 'group-1',
      name: 'Backend Physics',
      pricePerStudent: 650,
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
      capacity: 28,
      isFixedTime: true,
      startTime: '11:00',
      duration: 120,
      daySchedules: {},
      scheduleDays: ['Monday', 'Wednesday'],
      autoInvoice: true,
      allowSelfEnroll: false,
      hasSpecificDuration: false,
      startDate: null,
      endDate: null,
      requireApproval: true,
      isActive: true,
    };
    teacherClassificationResponse = {
      stages: [],
      grades: [],
      universities: [],
      colleges: [],
      subjects: [],
    };
    assignedTeachersResponse = [];
    taskServiceMock = {
      getTask: vi.fn(() => undefined),
      removeTask: vi.fn(),
      addTask: vi.fn(),
    };
    const dataService = {
      loadCreateOptions: () => of(createOptionsResponse),
      loadGroupForEdit: (groupId: string) => {
        editLoadCalls.push(groupId);
        return of(editPayload);
      },
      loadSubjects: () => of(subjectsResponse),
      loadAssignedTeachers: (params: unknown) => {
        assignedTeacherCalls.push(params);
        return of(assignedTeachersResponse);
      },
      loadTeacherClassification: (params: unknown) => {
        teacherClassificationCalls.push(params);
        return of(teacherClassificationResponse);
      },
      loadTeacherAvailability: () => of({
        teacherId: 'teacher-1',
        unavailableRanges: [],
      }),
      loadRoomAvailability: () => of({
        unavailableRanges: [],
      }),
      createOrUpdateGroup: (payload: TenantGroupCreateApiPayload, groupId?: string | null) => {
        submitCalls.push({ payload, groupId });
        return of({ id: 'group-1' });
      },
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true), url: '/tenant/groups/create' },
        },
        {
          provide: TaskService,
          useValue: taskServiceMock,
        },
        { provide: TenantGroupCreateDataService, useValue: dataService },
      ],
    });

    facade = TestBed.inject(TenantGroupCreateFacade);
    store = TestBed.inject(TenantGroupCreateStore);
    store.setCreateOptions(createOptionsResponse);
    facade.onEducationCategoryChange('BASIC_EDUCATION');
  });

  it('should toggle teacher dropdown and close others', () => {
    facade.toggleGradeDropdown();
    facade.toggleTeacherDropdown();

    expect(facade.showTeacherDropdown()).toBe(true);
    expect(facade.showGradeDropdown()).toBe(false);
  });

  it('should add and remove selected day', () => {
    facade.onDayToggle('Monday');
    expect(facade.selectedDays()).toContain('Monday');

    facade.onDayToggle('Monday');
    expect(facade.selectedDays()).not.toContain('Monday');
  });

  it('keeps Assigned Teacher options independent from Owned By', () => {
    facade.groupForm.patchValue({ teacher: 'Sarah Nabil', stage: 'Secondary' });

    facade.selectOwnedBy('Center');

    expect(facade.groupForm.get('teacher')?.value).toBe('Sarah Nabil');
    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Sarah Nabil']);
  });

  it('filters Assigned Teacher options when education category changes', () => {
    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Sarah Nabil']);

    facade.onEducationCategoryChange('UNIVERSITY_EDUCATION');

    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Omar Adel']);
    expect(facade.groupForm.get('teacher')?.value).toBe('');

    facade.onEducationCategoryChange('BASIC_EDUCATION');

    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Sarah Nabil']);
  });

  it('loads teacher classification when selecting a teacher with Center ownership', () => {
    teacherClassificationResponse = {
      stages: [{ id: 'stage-1', name: 'Secondary' }],
      grades: [{ id: 'grade-1', name: 'Grade 12', parentId: 'stage-1' }],
      universities: [],
      colleges: [],
      subjects: [{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }],
    };
    facade.groupForm.patchValue({ ownedBy: 'Center' });

    facade.selectTeacher('Sarah Nabil');

    expect(teacherClassificationCalls).toEqual([{
      educationCategory: 'BASIC_EDUCATION',
      teacherId: 'teacher-1',
    }]);
    expect(facade.filteredStages().map((stage) => stage.name)).toEqual(['Secondary']);
    expect(facade.filteredSubjects().map((subject) => subject.name)).toEqual(['Physics']);
  });

  it('filters Assigned Teacher from a completed Basic Education classification', () => {
    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    assignedTeachersResponse = [{ id: 'teacher-1', name: 'Sarah Nabil' }];
    facade.groupForm.patchValue({
      educationCategory: 'BASIC_EDUCATION',
      stage: 'Secondary',
      grade: 'Grade 12',
    });

    facade.selectSubject('Physics');

    expect(assignedTeacherCalls).toEqual([{
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
      universityId: undefined,
      collegeId: undefined,
      universitySubjectId: undefined,
    }]);
    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Sarah Nabil']);
  });

  it('filters Assigned Teacher from a completed University Education classification', () => {
    assignedTeachersResponse = [{ id: 'teacher-2', name: 'Omar Adel' }];
    facade.onEducationCategoryChange('UNIVERSITY_EDUCATION');
    store.setSubjects([{ id: 'subject-1', name: 'Thermodynamics', universityId: 'university-1', collegeId: 'college-1' }]);
    facade.groupForm.patchValue({
      university: 'Cairo University',
      college: 'Engineering',
    });

    facade.selectSubject('Thermodynamics');

    expect(assignedTeacherCalls).toEqual([{
      educationCategory: 'UNIVERSITY_EDUCATION',
      stageId: undefined,
      gradeId: undefined,
      subjectId: undefined,
      universityId: 'university-1',
      collegeId: 'college-1',
      universitySubjectId: 'subject-1',
    }]);
    expect(facade.filteredTeachers().map((teacher) => teacher.name)).toEqual(['Omar Adel']);
  });

  it('loads backend edit data instead of placeholder values during edit initialization', () => {
    assignedTeachersResponse = [{ id: 'teacher-1', name: 'Sarah Nabil' }];

    facade.initialize('group-1');

    expect(editLoadCalls).toEqual(['group-1']);
    expect(facade.groupForm.get('name')?.value).toBe('Backend Physics');
    expect(facade.groupForm.get('capacity')?.value).toBe(28);
    expect(facade.groupForm.get('fees')?.value).toBe(650);
    expect(facade.groupForm.get('stage')?.value).toBe('Secondary');
    expect(facade.groupForm.get('grade')?.value).toBe('Grade 12');
    expect(facade.groupForm.get('subject')?.value).toBe('Physics');
    expect(facade.groupForm.get('teacher')?.value).toBe('Sarah Nabil');
    expect(facade.groupForm.get('room')?.value).toBe('Lab 101');
    expect(facade.selectedDays()).toEqual(['Monday', 'Wednesday']);
  });

  it('maps University Education edit ids into existing selector values', () => {
    subjectsResponse = [{ id: 'university-subject-1', name: 'Thermodynamics', universityId: 'university-1', collegeId: 'college-1' }];
    assignedTeachersResponse = [{ id: 'teacher-2', name: 'Omar Adel' }];
    editPayload = {
      ...editPayload,
      educationCategory: 'UNIVERSITY_EDUCATION',
      stageId: null,
      gradeId: null,
      subjectId: null,
      universityId: 'university-1',
      collegeId: 'college-1',
      universitySubjectId: 'university-subject-1',
      assignedTeacherId: 'teacher-2',
    };

    facade.initialize('group-1');

    expect(facade.groupForm.get('educationCategory')?.value).toBe('UNIVERSITY_EDUCATION');
    expect(facade.groupForm.get('university')?.value).toBe('Cairo University');
    expect(facade.groupForm.get('college')?.value).toBe('Engineering');
    expect(facade.groupForm.get('subject')?.value).toBe('Thermodynamics');
    expect(facade.groupForm.get('teacher')?.value).toBe('Omar Adel');
    expect(facade.groupForm.get('stage')?.value).toBe('');
    expect(facade.groupForm.get('grade')?.value).toBe('');
  });

  it('passes the selected group id when submitting edit mode and keeps create mode without an id', () => {
    assignedTeachersResponse = [{ id: 'teacher-1', name: 'Sarah Nabil' }];
    facade.initialize('group-1');
    facade.groupForm.patchValue({ paymentMethod: 'Monthly',
      paymentMethodId: 'period-1' });

    facade.onSubmit();

    expect(submitCalls.at(-1)?.groupId).toBe('group-1');
    expect(submitCalls.at(-1)?.payload.name).toBe('Backend Physics');

    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    store.setTeachers([{ id: 'teacher-1', name: 'Sarah Nabil' }]);
    store.setGroupId(null);
    facade.groupForm.patchValue({
      name: 'Create Physics',
      educationCategory: 'BASIC_EDUCATION',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      capacity: 25,
      fees: 500,
    });

    facade.onSubmit();

    expect(submitCalls.at(-1)?.groupId).toBeNull();
    expect(submitCalls.at(-1)?.payload.name).toBe('Create Physics');
  });

  it('submits duration start and end dates to the backend payload', () => {
    facade.initialize(null);
    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    store.setTeachers([{ id: 'teacher-1', name: 'Sarah Nabil' }]);
    facade.groupForm.patchValue({
      name: 'Create Physics',
      educationCategory: 'BASIC_EDUCATION',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      capacity: 25,
      fees: 500,
      startDate: '2026-06-01',
      endDate: '2026-07-01',
    });

    facade.onSubmit();

    expect(submitCalls.at(-1)?.payload).toEqual(expect.objectContaining({
      hasSpecificDuration: true,
      startDate: '2026-06-01',
      endDate: '2026-07-01',
    }));
  });


  it('omits the fixed room id when submitting different time per day schedules', () => {
    facade.initialize(null);
    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    store.setTeachers([{ id: 'teacher-1', name: 'Sarah Nabil' }]);
    facade.groupForm.patchValue({
      name: 'Create Physics',
      educationCategory: 'BASIC_EDUCATION',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      capacity: 25,
      fees: 500,
    });
    facade.onDayToggle('Sunday');
    facade.onDayToggle('Monday');
    facade.onTimeTypeChange(false);
    (facade.groupForm.get(['daySchedules', 'Sunday']) as FormGroup).patchValue({
      startTime: '09:00',
      endTime: '10:00',
      room: 'Lab 101',
    });
    (facade.groupForm.get(['daySchedules', 'Monday']) as FormGroup).patchValue({
      startTime: '11:00',
      endTime: '12:00',
      room: 'Lab 102',
    });

    facade.onSubmit();

    const payload = submitCalls.at(-1)?.payload;
    expect(payload).not.toHaveProperty('roomId');
    expect(payload?.daySchedules).toEqual({
      Sunday: { startTime: '09:00', endTime: '10:00', room: 'Lab 101', roomId: 'room-1' },
      Monday: { startTime: '11:00', endTime: '12:00', room: 'Lab 102', roomId: 'room-2' },
    });
  });

  it('recalculates teacher availability conflict when duration changes into an occupied range', () => {
    facade.initialize(null);
    store.setTeacherUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      day: 'Monday',
      startTime: '11:30',
      endTime: '12:30',
      duration: 60,
    }]);
    facade.groupForm.patchValue({
      startTime: '10:30',
      duration: 60,
    });
    facade.onDayToggle('Monday');

    expect(facade.hasTeacherAvailabilityConflict()).toBe(false);

    facade.groupForm.patchValue({ duration: 90 });

    expect(facade.hasTeacherAvailabilityConflict()).toBe(true);
    expect(facade.groupForm.hasError('teacherUnavailable')).toBe(true);
  });

  it('filters rooms by selected day, start time, duration, and boundary intervals', () => {
    facade.initialize(null);
    store.setRoomUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      roomId: 'room-1',
      roomName: 'Lab 101',
      day: 'Sunday',
      startTime: '13:00',
      endTime: '14:30',
      duration: 90,
    }]);
    facade.groupForm.patchValue({
      startTime: '14:00',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 102']);

    facade.groupForm.patchValue({ startTime: '14:30' });

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 101', 'Lab 102']);

    facade.groupForm.patchValue({ startTime: '12:00', duration: 60 });

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 101', 'Lab 102']);
  });

  it('keeps available rooms visible when fixed time uses AM/PM display text', () => {
    facade.initialize(null);
    store.setRoomUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      roomId: 'room-1',
      roomName: 'Lab 101',
      day: 'Sunday',
      startTime: '13:00',
      endTime: '14:30',
      duration: 90,
    }]);
    facade.groupForm.patchValue({
      startTime: '2:30 PM',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 101', 'Lab 102']);

    facade.groupForm.patchValue({ startTime: '2:00 PM' });

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 102']);
  });

  it('keeps non-conflicting rooms visible when another room overlaps', () => {
    facade.initialize(null);
    store.setCreateOptions({
      ...createOptionsResponse,
      rooms: [
        { id: 'room-1', name: 'Lab 101' },
        { id: 'room-2', name: 'Lab 102' },
        { id: 'room-3', name: 'Lab 103' },
      ],
    });
    store.setRoomUnavailableRanges([
      {
        groupId: 'group-existing-1',
        groupName: 'Physics Existing',
        roomId: 'room-1',
        roomName: 'Lab 101',
        day: 'Sunday',
        startTime: '13:00',
        endTime: '14:30',
        duration: 90,
      },
      {
        groupId: 'group-existing-2',
        groupName: 'Math Existing',
        roomId: 'room-2',
        roomName: 'Lab 102',
        day: 'Sunday',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
      },
    ]);
    facade.groupForm.patchValue({
      startTime: '14:00',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 102', 'Lab 103']);
  });

  it('marks selected room invalid when schedule changes into a room conflict', () => {
    facade.initialize(null);
    store.setRoomUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      roomId: 'room-1',
      roomName: 'Lab 101',
      day: 'Sunday',
      startTime: '13:00',
      endTime: '14:30',
      duration: 90,
    }]);
    facade.groupForm.patchValue({
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '14:30',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    expect(facade.hasRoomAvailabilityConflict()).toBe(false);

    facade.groupForm.patchValue({ startTime: '14:00' });

    expect(facade.hasRoomAvailabilityConflict()).toBe(true);
    expect(facade.groupForm.hasError('roomUnavailable')).toBe(true);
  });

  it('restores room options and clears selected room conflict when schedule becomes available', () => {
    facade.initialize(null);
    store.setRoomUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      roomId: 'room-1',
      roomName: 'Lab 101',
      day: 'Sunday',
      startTime: '13:00',
      endTime: '14:30',
      duration: 90,
    }]);
    facade.groupForm.patchValue({
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '14:00',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    expect(facade.hasRoomAvailabilityConflict()).toBe(true);
    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 102']);

    facade.groupForm.patchValue({ startTime: '14:30' });

    expect(facade.hasRoomAvailabilityConflict()).toBe(false);
    expect(facade.groupForm.hasError('roomUnavailable')).toBe(false);
    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 101', 'Lab 102']);

    facade.onDayToggle('Sunday');
    facade.onDayToggle('Monday');

    expect(facade.hasRoomAvailabilityConflict()).toBe(false);
    expect(facade.filteredRooms().map((room) => room.name)).toEqual(['Lab 101', 'Lab 102']);
  });

  it('blocks submit and shows the room unavailable message for a selected room conflict', () => {
    facade.initialize(null);
    store.setRoomUnavailableRanges([{
      groupId: 'group-existing',
      groupName: 'Physics Existing',
      roomId: 'room-1',
      roomName: 'Lab 101',
      day: 'Sunday',
      startTime: '13:00',
      endTime: '14:30',
      duration: 90,
    }]);
    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    store.setTeachers([{ id: 'teacher-1', name: 'Sarah Nabil' }]);
    facade.groupForm.patchValue({
      name: 'Physics G12-B',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '14:00',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    facade.onSubmit();

    expect(submitCalls).toEqual([]);
    expect(facade.errorMessage()).toBe('This room cannot be selected; it is not available at this time.');
  });

  it('normalizes AM/PM fixed time before submitting to the API', () => {
    facade.initialize(null);
    store.setSubjects([{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }]);
    store.setTeachers([{ id: 'teacher-1', name: 'Sarah Nabil' }]);
    facade.groupForm.patchValue({
      name: 'Physics G12-C',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Lab 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '2:30 PM',
      duration: 60,
    });
    facade.onDayToggle('Sunday');

    facade.onSubmit();

    expect(submitCalls.at(-1)?.payload.startTime).toBe('14:30');
  });

  it('stores create group drafts with the create form route', () => {
    facade.initialize(null);
    facade.groupForm.patchValue({ name: 'Physics Draft' });

    facade.onDestroy();

    expect(taskServiceMock.addTask).toHaveBeenCalledWith(expect.objectContaining({
      id: 'create-group-task',
      route: '/tenant/groups/create',
      data: expect.objectContaining({ name: 'Physics Draft' }),
    }));
  });

  it('stores edit group drafts with the edit form route', () => {
    facade.initialize('group-1');
    facade.groupForm.patchValue({ name: 'Edited Physics Draft' });

    facade.onDestroy();

    expect(taskServiceMock.addTask).toHaveBeenCalledWith(expect.objectContaining({
      id: 'edit-group-group-1',
      route: '/tenant/groups/group-1/edit',
      data: expect.objectContaining({ name: 'Edited Physics Draft' }),
    }));
  });
});
