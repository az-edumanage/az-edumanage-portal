import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TenantTeachersDataService } from '../data-access/tenant-teachers-data.service';
import { Teacher, TeacherCapacity, TeacherStatus, TeacherStatusSummary } from '../models/tenant-teachers.models';
import { TenantTeachersFacade } from './tenant-teachers.facade';
import { TenantTeachersStore } from './tenant-teachers.store';

class TenantTeachersDataServiceMock {
  deleteTeacher = vi.fn<(teacherId: string) => Observable<void>>(() => of(undefined));
  listTeachers = vi.fn<() => Observable<Teacher[]>>(() => of([]));
  statusSummary = vi.fn<() => Observable<TeacherStatusSummary>>();
  capacity = vi.fn<() => Observable<TeacherCapacity>>(() => of({
    tenantType: 'CENTER',
    currentTeachers: 0,
    maxTeachers: null,
    canCreate: true,
  }));
  updateStatus = vi.fn<(teacher: Teacher, status: TeacherStatus) => Observable<Teacher>>();
  changeTeacherPassword = vi.fn<(teacherId: string, newPassword: string) => Observable<void>>();
}

describe('TenantTeachersFacade', () => {
  let facade: TenantTeachersFacade;
  let store: TenantTeachersStore;
  let data: TenantTeachersDataServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TenantTeachersDataService, useClass: TenantTeachersDataServiceMock }],
    });
    facade = TestBed.inject(TenantTeachersFacade);
    store = TestBed.inject(TenantTeachersStore);
    data = TestBed.inject(TenantTeachersDataService) as unknown as TenantTeachersDataServiceMock;
  });

  it('deletes confirmed teachers and removes them from the table rows', () => {
    const teacher = teacherFixture('teacher-1', 'Dr. Ahmed Zewail');
    store.setTeachers([teacher, teacherFixture('teacher-2', 'Mona Helmy')]);
    facade.requestDelete(teacher);

    facade.confirmDelete();

    expect(data.deleteTeacher).toHaveBeenCalledWith('teacher-1');
    expect(store.teachers().map((item) => item.id)).toEqual(['teacher-2']);
    expect(store.deleteState().status).toBe('success');
  });

  it('keeps assigned teachers visible when backend rejects deletion', () => {
    const teacher = teacherFixture('teacher-1', 'Dr. Ahmed Zewail');
    data.deleteTeacher.mockReturnValue(throwError(() => new Error('Teacher cannot be deleted while assigned to a group')));
    store.setTeachers([teacher]);
    facade.requestDelete(teacher);

    facade.confirmDelete();

    expect(store.teachers()).toEqual([teacher]);
    expect(store.deleteState().status).toBe('failed');
    expect(store.deleteState().message).toBe('Teacher cannot be deleted while assigned to a group');
  });
});

function teacherFixture(id: string, name: string): Teacher {
  return {
    id,
    name,
    fullName: name,
    email: `${id}@center.edu`,
    username: id,
    educationCategory: 'BASIC_EDUCATION',
    subject: 'Physics',
    subjects: [{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }],
    universitySubjects: [],
    status: 'Active',
    joinDate: '2026-05-31',
    documents: [],
    stageIds: ['stage-1'],
    gradeIds: ['grade-1'],
    subjectIds: ['subject-1'],
    universityIds: [],
    collegeIds: [],
    universitySubjectIds: [],
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
  };
}
