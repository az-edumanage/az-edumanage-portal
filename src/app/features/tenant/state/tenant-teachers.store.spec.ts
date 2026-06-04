import { TestBed } from '@angular/core/testing';
import { TenantTeachersStore } from './tenant-teachers.store';

describe('TenantTeachersStore', () => {
  let store: TenantTeachersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantTeachersStore);
  });

  it('filters teachers by subject and status', () => {
    store.setTeachers([
      {
        id: 'teacher-1',
        name: 'Dr. Ahmed Zewail',
        fullName: 'Dr. Ahmed Zewail',
        email: 'zewail@center.edu',
        username: 'ahmed.zewail',
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
      },
    ]);
    store.subjectFilter.set('Physics');
    store.statusFilter.set('Active');

    const filtered = store.filteredTeachers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Dr. Ahmed Zewail');
  });

  it('tracks filter badge count', () => {
    expect(store.activeFiltersCount()).toBe(0);
    store.subjectFilter.set('Biology');
    store.statusFilter.set('Active');
    store.sortBy.set('date-desc');

    expect(store.activeFiltersCount()).toBe(3);
  });

  it('starts without static teacher rows', () => {
    expect(store.teachers()).toEqual([]);
  });
});
