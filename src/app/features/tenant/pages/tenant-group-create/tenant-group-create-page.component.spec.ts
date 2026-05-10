import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TenantGroupCreatePageComponent } from './tenant-group-create-page.component';
import { TenantGroupCreateFacade } from '../../state/tenant-group-create.facade';

describe('TenantGroupCreatePageComponent', () => {
  const fb = new FormBuilder();

  const mockFacade = {
    groupForm: fb.group({
      name: [''],
      grade: [''],
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
      autoInvoice: [true],
      allowSelfEnroll: [false],
      hasSpecificDuration: [false],
      startDate: [''],
      endDate: [''],
      requireApproval: [true],
      isActive: [true],
    }),
    isSubmitting: signal(false),
    isEditMode: signal(false),
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    selectedDays: signal<string[]>([]),
    showOwnedByDropdown: signal(false),
    showTeacherDropdown: signal(false),
    showGradeDropdown: signal(false),
    showSubjectDropdown: signal(false),
    showRoomDropdown: signal(false),
    teacherSearchQuery: signal(''),
    gradeSearchQuery: signal(''),
    subjectSearchQuery: signal(''),
    roomSearchQuery: signal(''),
    filteredTeachers: signal([]),
    filteredGrades: signal([]),
    filteredSubjects: signal([]),
    filteredRooms: signal([]),
    initialize: (_id: string | null) => {},
    onDestroy: () => {},
    onDayToggle: (_day: string) => {},
    onTimeTypeChange: (_isFixed: boolean) => {},
    toggleOwnedByDropdown: () => {},
    selectOwnedBy: (_value: string) => {},
    toggleTeacherDropdown: () => {},
    selectTeacher: (_value: string) => {},
    toggleGradeDropdown: () => {},
    selectGrade: (_value: string) => {},
    toggleSubjectDropdown: () => {},
    selectSubject: (_value: string) => {},
    toggleRoomDropdown: () => {},
    selectRoom: (_value: string) => {},
    setTeacherSearchQuery: (_value: string) => {},
    setGradeSearchQuery: (_value: string) => {},
    setSubjectSearchQuery: (_value: string) => {},
    setRoomSearchQuery: (_value: string) => {},
    onCancel: () => {},
    onSubmit: () => {},
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: () => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantGroupCreatePageComponent],
      providers: [
        provideRouter([]),
        { provide: TenantGroupCreateFacade, useValue: mockFacade },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
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
});
