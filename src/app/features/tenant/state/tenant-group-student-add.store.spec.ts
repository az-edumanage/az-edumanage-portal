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
    store.selectedStudent.set({ id: '1', name: 'A', email: 'a@x.com', grade: 'Grade 12' });

    expect(store.selectedStudent()?.id).toBe('1');
  });
});
