import { TestBed } from '@angular/core/testing';
import { TenantTeacherCreateStore } from './tenant-teacher-create.store';

describe('TenantTeacherCreateStore', () => {
  let store: TenantTeacherCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantTeacherCreateStore);
  });

  it('should initialize in create mode', () => {
    expect(store.teacherId()).toBeNull();
    expect(store.isEditMode()).toBe(false);
  });

  it('should switch to edit mode when teacher id is set', () => {
    store.setTeacherId('teacher-1');

    expect(store.teacherId()).toBe('teacher-1');
    expect(store.isEditMode()).toBe(true);
  });

  it('filters grades and subjects by selected education hierarchy', () => {
    store.setLookups(
      [{ id: 'stage-1', name: 'Primary' }, { id: 'stage-2', name: 'Secondary' }],
      [
        { id: 'grade-1', name: 'Grade 1', stageId: 'stage-1' },
        { id: 'grade-2', name: 'Grade 2', stageId: 'stage-2' },
      ],
      [
        { id: 'subject-1', name: 'Math', stageId: 'stage-1', gradeId: 'grade-1' },
        { id: 'subject-2', name: 'Physics', stageId: 'stage-2', gradeId: 'grade-2' },
      ],
      [],
      [],
      [],
    );

    store.setSelectedStageIds(['stage-1']);
    store.setSelectedGradeIds(['grade-1']);

    expect(store.availableGrades().map((grade) => grade.id)).toEqual(['grade-1']);
    expect(store.availableSubjects().map((subject) => subject.id)).toEqual(['subject-1']);
  });

  it('filters colleges and university subjects by selected university hierarchy', () => {
    store.setLookups(
      [],
      [],
      [],
      [{ id: 'university-1', name: 'Cairo University' }, { id: 'university-2', name: 'Ain Shams University' }],
      [
        { id: 'college-1', name: 'Engineering', universityId: 'university-1' },
        { id: 'college-2', name: 'Medicine', universityId: 'university-2' },
      ],
      [
        { id: 'subject-1', name: 'Circuits', universityId: 'university-1', collegeId: 'college-1' },
        { id: 'subject-2', name: 'Anatomy', universityId: 'university-2', collegeId: 'college-2' },
      ],
    );

    store.setSelectedUniversityIds(['university-1']);
    store.setSelectedCollegeIds(['college-1']);

    expect(store.availableColleges().map((college) => college.id)).toEqual(['college-1']);
    expect(store.availableUniversitySubjects().map((subject) => subject.id)).toEqual(['subject-1']);
  });
});
