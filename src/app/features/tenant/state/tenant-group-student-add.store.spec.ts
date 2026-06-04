import { TestBed } from '@angular/core/testing';
import { TenantGroupStudentAddStore } from './tenant-group-student-add.store';

describe('TenantGroupStudentAddStore', () => {
  let store: TenantGroupStudentAddStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupStudentAddStore);
  });

  it('should assign group and task identifiers', () => {
    store.setGroupId('group-7');

    expect(store.groupId()).toBe('group-7');
    expect(store.taskId()).toBe('enroll-student-group-group-7');
  });

  it('should update selected student state', () => {
    store.setCandidateStudents([
      { id: '1', name: 'A', email: 'a@x.com', grade: 'Grade 12' },
      { id: '2', name: 'B', email: 'b@x.com', grade: 'Grade 12' },
    ]);
    store.setSelectedStudentIds(['1']);

    expect(store.selectedStudent()?.id).toBe('1');
    expect(store.selectedStudents().map((student) => student.id)).toEqual(['1']);
  });

  it('should toggle multiple selected student ids', () => {
    const firstStudent = { id: '1', name: 'A', email: 'a@x.com', grade: 'Grade 12' };
    const secondStudent = { id: '2', name: 'B', email: 'b@x.com', grade: 'Grade 12' };
    store.setCandidateStudents([firstStudent, secondStudent]);

    store.toggleStudent(firstStudent);
    store.toggleStudent(secondStudent);

    expect(store.selectedStudentIds()).toEqual(['1', '2']);
    expect(store.hasSelectedStudents()).toBe(true);
    expect(store.isStudentSelected('2')).toBe(true);

    store.toggleStudent(firstStudent);

    expect(store.selectedStudentIds()).toEqual(['2']);
    expect(store.isStudentSelected('1')).toBe(false);
  });
});
