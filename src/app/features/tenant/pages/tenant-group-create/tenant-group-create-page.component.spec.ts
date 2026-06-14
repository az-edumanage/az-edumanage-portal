import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantGroupCreatePageComponent } from './tenant-group-create-page.component';
import { TenantGroupCreateDataService } from '../../data-access/tenant-group-create-data.service';
import { TenantGroupCreateFacade } from '../../state/tenant-group-create.facade';
import { TenantSubscriptionPeriodSettingsService } from '../../data-access/tenant-subscription-period-settings.service';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  template: '',
})
class EmptyRouteComponent {}

describe('TenantGroupCreatePageComponent', () => {
  const fb = new FormBuilder();

  const mockFacade = {
    groupForm: fb.group({
      name: [''],
      educationCategory: ['BASIC_EDUCATION'],
      stage: [''],
      grade: [''],
      university: [''],
      college: [''],
      subject: [''],
      teacher: [''],
      ownedBy: [''],
      room: [''],
      capacity: [25],
      isFixedTime: [true],
      startTime: ['10:00'],
      duration: [90],
      daySchedules: fb.group({}),
      fees: [500],
      paymentMethod: [''],
      paymentMethodId: [''],
      autoInvoice: [true],
      allowSelfEnroll: [false],
      hasSpecificDuration: [false],
      startDate: [''],
      endDate: [''],
      requireApproval: [true],
      isActive: [true],
    }),
    isSubmitting: signal(false),
    errorMessage: signal<string | null>(null),
    isLoadingTeacherAvailability: signal(false),
    hasTeacherAvailabilityConflict: signal(false),
    teacherUnavailableRanges: signal([]),
    isLoadingRoomAvailability: signal(false),
    hasRoomAvailabilityConflict: signal(false),
    isEditMode: signal(false),
    educationCategory: signal<'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION'>('BASIC_EDUCATION'),
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    selectedDays: signal<string[]>([]),
    ownerChoices: signal([]),
    showOwnedByDropdown: signal(false),
    showTeacherDropdown: signal(false),
    showStageDropdown: signal(false),
    showGradeDropdown: signal(false),
    showUniversityDropdown: signal(false),
    showCollegeDropdown: signal(false),
    showSubjectDropdown: signal(false),
    showRoomDropdown: signal(false),
    teacherSearchQuery: signal(''),
    stageSearchQuery: signal(''),
    gradeSearchQuery: signal(''),
    universitySearchQuery: signal(''),
    collegeSearchQuery: signal(''),
    subjectSearchQuery: signal(''),
    roomSearchQuery: signal(''),
    filteredTeachers: signal([]),
    filteredStages: signal([]),
    filteredGrades: signal([]),
    filteredUniversities: signal([]),
    filteredColleges: signal([]),
    filteredSubjects: signal([]),
    filteredRooms: signal([]),
    rooms: signal([]),
    initialize: vi.fn((_id: string | null, _freshCreate?: boolean) => {}),
    onDestroy: () => {},
    onDayToggle: (_day: string) => {},
    onTimeTypeChange: (_isFixed: boolean) => {},
    toggleOwnedByDropdown: () => {},
    selectOwnedBy: (_value: string) => {},
    toggleTeacherDropdown: () => {},
    selectTeacher: (_value: string) => {},
    onEducationCategoryChange: (_category: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION') => {},
    toggleStageDropdown: () => {},
    selectStage: (_value: string) => {},
    toggleGradeDropdown: () => {},
    selectGrade: (_value: string) => {},
    toggleUniversityDropdown: () => {},
    selectUniversity: (_value: string) => {},
    toggleCollegeDropdown: () => {},
    selectCollege: (_value: string) => {},
    subjectCreateQueryParams: () => ({ returnUrl: '/tenant/groups/create' }),
    collegeCreateQueryParams: () => ({ returnUrl: '/tenant/groups/create', universityId: 'university-1' }),
    toggleSubjectDropdown: () => {},
    selectSubject: (_value: string) => {},
    toggleRoomDropdown: () => {},
    selectRoom: (_value: string) => {},
    setTeacherSearchQuery: (_value: string) => {},
    setStageSearchQuery: (_value: string) => {},
    setGradeSearchQuery: (_value: string) => {},
    setUniversitySearchQuery: (_value: string) => {},
    setCollegeSearchQuery: (_value: string) => {},
    setSubjectSearchQuery: (_value: string) => {},
    setRoomSearchQuery: (_value: string) => {},
    onCancel: () => {},
    onSubmit: () => {},
  };

  const subscriptionPeriodSettings = {
    listSubscriptionPeriods: vi.fn(() => Promise.resolve([
      {
        id: 'period-1',
        name: 'Monthly',
        durationType: 'Month' as const,
        durationValue: 1,
        description: null,
        createdAt: '2026-06-06T00:00:00Z',
        updatedAt: '2026-06-06T00:00:00Z',
      },
    ])),
  };

  const mockActivatedRoute = { 
    snapshot: {
      paramMap: {
        get: (_key: string): string | null => null,
      },
      queryParamMap: {
        get: (_key: string): string | null => null,
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFacade.groupForm.reset({
      name: '',
      educationCategory: 'BASIC_EDUCATION',
      stage: '',
      grade: '',
      university: '',
      college: '',
      subject: '',
      teacher: '',
      ownedBy: '',
      room: '',
      capacity: 25,
      isFixedTime: true,
      startTime: '10:00',
      duration: 90,
      fees: 500,
      paymentMethod: '',
      paymentMethodId: '',
      autoInvoice: true,
      allowSelfEnroll: false,
      hasSpecificDuration: false,
      startDate: '',
      endDate: '',
      requireApproval: true,
      isActive: true,
    });
    subscriptionPeriodSettings.listSubscriptionPeriods.mockResolvedValue([
      {
        id: 'period-1',
        name: 'Monthly',
        durationType: 'Month' as const,
        durationValue: 1,
        description: null,
        createdAt: '2026-06-06T00:00:00Z',
        updatedAt: '2026-06-06T00:00:00Z',
      },
    ]);
    mockFacade.initialize.mockClear();

    await TestBed.configureTestingModule({
      imports: [TenantGroupCreatePageComponent],
      providers: [
        provideRouter([{ path: 'tenant/groups', component: EmptyRouteComponent }]),
        { provide: TenantGroupCreateFacade, useValue: mockFacade },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TenantSubscriptionPeriodSettingsService, useValue: subscriptionPeriodSettings },
      ],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders the group name input field', () => {
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);
    fixture.detectChanges();

    const groupNameInput = fixture.nativeElement.querySelector('#groupName');
    expect(groupNameInput).toBeTruthy();
  });

  it('passes fresh create mode when the route query param requests a new empty form', () => {
    vi.spyOn(mockActivatedRoute.snapshot.queryParamMap, 'get').mockReturnValueOnce('true');
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);

    fixture.detectChanges();

    expect(mockFacade.initialize).toHaveBeenCalledWith(null, true);
  });

  it('restores the visible subscription period method from the saved id in edit mode', async () => {
    mockFacade.groupForm.patchValue({ paymentMethod: '', paymentMethodId: 'period-1' });
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockFacade.groupForm.get('paymentMethod')?.value).toBe('Monthly');
    expect(mockFacade.groupForm.get('paymentMethodId')?.value).toBe('period-1');
  });

  it('restores the visible subscription period method when edit data arrives after options load', async () => {
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    mockFacade.groupForm.patchValue({ paymentMethod: '', paymentMethodId: 'period-1' });

    expect(mockFacade.groupForm.get('paymentMethod')?.value).toBe('Monthly');
    expect(mockFacade.groupForm.get('paymentMethodId')?.value).toBe('period-1');
  });

  it('keeps one schedule section and no extra availability panel', () => {
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);
    fixture.detectChanges();

    const scheduleSections = fixture.nativeElement.querySelectorAll('app-tenant-group-schedule-section');
    expect(scheduleSections.length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Teacher Availability');
  });

  it('disables the submit buttons when room availability is loading or conflicting', () => {
    mockFacade.isLoadingRoomAvailability.set(true);
    mockFacade.hasRoomAvailabilityConflict.set(false);
    const fixture = TestBed.createComponent(TenantGroupCreatePageComponent);
    fixture.detectChanges();

    const loadingButtons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .filter((button): button is HTMLButtonElement => button.textContent?.includes('Create Group') ?? false);
    expect(loadingButtons.every((button) => button.disabled)).toBe(true);

    mockFacade.isLoadingRoomAvailability.set(false);
    mockFacade.hasRoomAvailabilityConflict.set(true);
    fixture.detectChanges();

    const conflictingButtons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .filter((button): button is HTMLButtonElement => button.textContent?.includes('Create Group') ?? false);
    expect(conflictingButtons.every((button) => button.disabled)).toBe(true);

    mockFacade.hasRoomAvailabilityConflict.set(false);
  });
});

describe('TenantGroupCreateFacade teacher availability', () => {
  const createOptions = {
    owners: [{ id: 'owner-1', name: 'Center', subtitle: 'TENANT_ADMIN' }],
    teachers: [{ id: 'teacher-1', name: 'Sarah Nabil' }],
    stages: [{ id: 'stage-1', name: 'Secondary' }],
    grades: [{ id: 'grade-1', name: 'Grade 12', parentId: 'stage-1' }],
    universities: [],
    colleges: [],
    rooms: [{ id: 'room-1', name: 'Room 101' }],
  };

  const dataService = {
    loadCreateOptions: vi.fn(() => of(createOptions)),
    loadTeacherClassification: vi.fn(() => of({
      stages: createOptions.stages,
      grades: createOptions.grades,
      universities: [],
      colleges: [],
      subjects: [{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }],
    })),
    loadTeacherAvailability: vi.fn(() => of({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'group-existing',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '10:30',
        endTime: '11:30',
        duration: 60,
      }],
    })),
    loadRoomAvailability: vi.fn(() => of({
      unavailableRanges: [],
    })),
    loadAssignedTeachers: vi.fn(() => of(createOptions.teachers)),
    loadSubjects: vi.fn(() => of([])),
    loadGroupForEdit: vi.fn(),
    createOrUpdateGroup: vi.fn(() => of({ id: 'group-1' })),
  };

  const taskService = {
    getTask: vi.fn(() => null),
    addTask: vi.fn(),
    removeTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'tenant/groups', component: EmptyRouteComponent }]),
        TenantGroupCreateFacade,
        { provide: TenantGroupCreateDataService, useValue: dataService },
        { provide: TaskService, useValue: taskService },
      ],
    });
  });

  it('loads teacher availability after selecting a teacher', () => {
    const facade = TestBed.inject(TenantGroupCreateFacade);
    facade.initialize(null);

    facade.selectTeacher('Sarah Nabil');

    expect(dataService.loadTeacherAvailability).toHaveBeenCalledWith('teacher-1', null);
    expect(facade.teacherUnavailableRanges()[0].startTime).toBe('10:30');
  });

  it('blocks submit and shows the exact message for overlapping manual time entry', () => {
    const facade = TestBed.inject(TenantGroupCreateFacade);
    facade.initialize(null);
    facade.groupForm.patchValue({
      name: 'Physics G12-B',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Room 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '10:00',
      duration: 60,
    });
    facade.selectTeacher('Sarah Nabil');
    facade.onDayToggle('Monday');

    facade.onSubmit();

    expect(dataService.createOrUpdateGroup).not.toHaveBeenCalled();
    expect(facade.errorMessage()).toBe('This time cannot be selected; the teacher is not available at this time.');
    expect(facade.groupForm.invalid).toBeTruthy();
  });

  it('blocks submit when same-day manual 12:00 starts inside an 11:30 teacher range', () => {
    dataService.loadTeacherAvailability.mockReturnValueOnce(of({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'group-existing',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        duration: 60,
      }],
    }));
    const facade = TestBed.inject(TenantGroupCreateFacade);
    facade.initialize(null);
    facade.groupForm.patchValue({
      name: 'Physics G12-B',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Room 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '12:00',
      duration: 90,
    });
    facade.selectTeacher('Sarah Nabil');
    facade.onDayToggle('Monday');

    facade.onSubmit();

    expect(dataService.createOrUpdateGroup).not.toHaveBeenCalled();
    expect(facade.errorMessage()).toBe('This time cannot be selected; the teacher is not available at this time.');
    expect(facade.hasTeacherAvailabilityConflict()).toBe(true);
  });

  it('allows same-day 12:30 when the existing teacher range ends at 12:30', () => {
    dataService.loadTeacherAvailability.mockReturnValueOnce(of({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'group-existing',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        duration: 60,
      }],
    }));
    const facade = TestBed.inject(TenantGroupCreateFacade);
    facade.initialize(null);
    facade.groupForm.patchValue({
      name: 'Physics G12-B',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Room 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '12:30',
      duration: 60,
    });
    facade.selectTeacher('Sarah Nabil');
    facade.onDayToggle('Monday');

    facade.onSubmit();

    expect(facade.hasTeacherAvailabilityConflict()).toBe(false);
    expect(dataService.createOrUpdateGroup).toHaveBeenCalled();
  });

  it('allows different-day 12:00 when only Monday is occupied for the teacher', () => {
    dataService.loadTeacherAvailability.mockReturnValueOnce(of({
      teacherId: 'teacher-1',
      unavailableRanges: [{
        groupId: 'group-existing',
        groupName: 'Physics G12-A',
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        duration: 60,
      }],
    }));
    const facade = TestBed.inject(TenantGroupCreateFacade);
    facade.initialize(null);
    facade.groupForm.patchValue({
      name: 'Physics G12-B',
      stage: 'Secondary',
      grade: 'Grade 12',
      subject: 'Physics',
      teacher: 'Sarah Nabil',
      ownedBy: 'Center',
      room: 'Room 101',
      paymentMethod: 'Monthly',
      paymentMethodId: 'period-1',
      startTime: '12:00',
      duration: 90,
    });
    facade.selectTeacher('Sarah Nabil');
    facade.onDayToggle('Tuesday');

    facade.onSubmit();

    expect(facade.hasTeacherAvailabilityConflict()).toBe(false);
    expect(dataService.createOrUpdateGroup).toHaveBeenCalled();
  });
});
