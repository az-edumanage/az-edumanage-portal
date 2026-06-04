import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantTeacherCreateDataService } from '../data-access/tenant-teacher-create-data.service';
import { TenantTeacherEditSeed, TenantTeacherLookupData } from '../models/tenant-teacher-create.models';
import { TenantTeacherCreateFacade } from './tenant-teacher-create.facade';
import { TenantTeacherCreateStore } from './tenant-teacher-create.store';

describe('TenantTeacherCreateFacade', () => {
  let facade: TenantTeacherCreateFacade;
  let lookups$: Subject<TenantTeacherLookupData>;
  let teacher$: Subject<TenantTeacherEditSeed>;
  const dataServiceMock = {
    getDefaultFormValue: vi.fn(),
    loadLookups: vi.fn(),
    getTeacherForEdit: vi.fn(),
    createOrUpdateTeacher: vi.fn(),
  };

  beforeEach(() => {
    lookups$ = new Subject<TenantTeacherLookupData>();
    teacher$ = new Subject<TenantTeacherEditSeed>();
    dataServiceMock.getDefaultFormValue.mockReturnValue(defaultFormValue());
    dataServiceMock.loadLookups.mockReturnValue(lookups$);
    dataServiceMock.getTeacherForEdit.mockReturnValue(teacher$);

    TestBed.configureTestingModule({
      providers: [
        TenantTeacherCreateFacade,
        TenantTeacherCreateStore,
        { provide: TenantTeacherCreateDataService, useValue: dataServiceMock },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: TaskService, useValue: { getTask: vi.fn(), addTask: vi.fn(), removeTask: vi.fn() } },
      ],
    });

    facade = TestBed.inject(TenantTeacherCreateFacade);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads lookups before patching edit values so university selections are preserved', () => {
    facade.initialize('teacher-1');

    expect(dataServiceMock.getTeacherForEdit).not.toHaveBeenCalled();

    lookups$.next({
      stages: [],
      grades: [],
      subjects: [],
      universities: [{ id: 'university-1', name: 'Cairo University' }],
      colleges: [{ id: 'college-1', name: 'Engineering', universityId: 'university-1' }],
      universitySubjects: [{ id: 'university-subject-1', name: 'Circuits', universityId: 'university-1', collegeId: 'college-1' }],
    });

    expect(dataServiceMock.getTeacherForEdit).toHaveBeenCalledWith('teacher-1');

    teacher$.next({
      educationCategory: 'UNIVERSITY_EDUCATION',
      universityIds: ['university-1'],
      collegeIds: ['college-1'],
      universitySubjectIds: ['university-subject-1'],
    });

    expect(facade.teacherForm.controls.universityIds.value).toEqual(['university-1']);
    expect(facade.teacherForm.controls.collegeIds.value).toEqual(['college-1']);
    expect(facade.teacherForm.controls.universitySubjectIds.value).toEqual(['university-subject-1']);
    expect(facade.availableColleges().map((college) => college.id)).toEqual(['college-1']);
    expect(facade.availableUniversitySubjects().map((subject) => subject.id)).toEqual(['university-subject-1']);
  });
});

function defaultFormValue() {
  return {
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: 'Teacher123!',
    forcePasswordChange: true,
    educationCategory: 'BASIC_EDUCATION' as const,
    stageIds: [],
    gradeIds: [],
    subjectIds: [],
    universityIds: [],
    collegeIds: [],
    universitySubjectIds: [],
    status: 'Active' as const,
    joinDate: '2026-05-31',
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
    documents: [],
  };
}
