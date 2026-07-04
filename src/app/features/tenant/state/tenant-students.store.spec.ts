import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';
import { Student, StudentAttendanceSummary } from '../models/tenant-students.models';
import { TenantStudentsStore } from './tenant-students.store';

describe('TenantStudentsStore', () => {
  let store: TenantStudentsStore;
  let dataService: {
    loadStudents: ReturnType<typeof vi.fn>;
    loadAttendanceSummary: ReturnType<typeof vi.fn>;
  };

  const students: Student[] = [
    {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 12',
      gradeId: 'grade-12',
      stage: 'Secondary Stage',
      stageId: 'stage-secondary',
      status: 'Active',
      enrollmentDate: '2024-01-10',
    },
    {
      id: 'student-2',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      grade: 'Grade 11',
      gradeId: 'grade-11',
      stage: 'Secondary Stage',
      stageId: 'stage-secondary',
      status: 'Inactive',
      enrollmentDate: '2023-09-15',
    },
    {
      id: 'student-3',
      name: 'Omar Hassan',
      email: 'omar@example.com',
      grade: 'Grade 10',
      gradeId: 'grade-10',
      stage: 'Preparatory Stage',
      stageId: 'stage-prep',
      status: 'Pending',
      enrollmentDate: '2023-10-20',
    },
  ];
  const summary: StudentAttendanceSummary = {
    totalStudents: 3,
    totalAbsent: 1,
    totalPresent: 1,
    absentStudentIds: ['student-2'],
    presentStudentIds: ['student-1'],
    today: '2026-06-29',
    asOf: '2026-06-29T10:45:00+03:00',
    unavailableReason: null,
  };

  beforeEach(() => {
    dataService = {
      loadStudents: vi.fn().mockReturnValue(of(students)),
      loadAttendanceSummary: vi.fn().mockReturnValue(of(summary)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantStudentsDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantStudentsStore);
    store.loadStudents();
    store.loadAttendanceSummary();
  });

  it('filters by stage, grade, and status', () => {
    store.stageFilter.set('stage-secondary');
    store.gradeFilter.set('grade-12');
    store.statusFilter.set('Active');

    const filtered = store.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Ahmed Ali');
  });

  it('searches loaded records by real student name and email', () => {
    store.searchQuery.set('sara@example.com');

    const filtered = store.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Sara Mohamed');
  });

  it('supports sort by newest enrollment date', () => {
    store.sortBy.set('date-desc');
    const filtered = store.filteredStudents();
    expect(filtered[0].enrollmentDate).toBe('2024-01-10');
  });

  it('uses list view by default', () => {
    expect(store.viewMode()).toBe('list');
  });

  it('paginates filtered students', () => {
    store.setPageSize(2);

    expect(store.totalFilteredStudents()).toBe(3);
    expect(store.totalPages()).toBe(2);
    expect(store.pageStart()).toBe(1);
    expect(store.pageEnd()).toBe(2);
    expect(store.pagedStudents().length).toBe(2);

    store.setPageIndex(1);

    expect(store.pageStart()).toBe(3);
    expect(store.pageEnd()).toBe(3);
    expect(store.pagedStudents().length).toBe(1);
  });

  it('clears loaded records when loading fails', () => {
    dataService.loadStudents.mockReturnValueOnce(throwError(() => new Error('Backend unavailable')));

    store.loadStudents();

    expect(store.students()).toEqual([]);
    expect(store.errorMessage()).toBe('Backend unavailable');
    expect(store.isLoading()).toBe(false);
  });

  it('builds attendance card view models from loaded students and summary', () => {
    expect(store.attendanceCards()).toEqual([
      expect.objectContaining({ key: 'all', label: 'Total students', count: 3, active: true, disabled: false }),
      expect.objectContaining({ key: 'absent', label: 'Total absence', count: 1, active: false, disabled: false }),
      expect.objectContaining({ key: 'present', label: 'Total present', count: 1, active: false, disabled: false }),
    ]);
  });

  it('filters absent students by attendance summary ids before other filters and resets pagination', () => {
    store.setPageSize(2);
    store.setPageIndex(1);

    store.setAttendanceFilter('absent');

    expect(store.pageIndex()).toBe(0);
    expect(store.filteredStudents().map((student) => student.id)).toEqual(['student-2']);

    store.searchQuery.set('ahmed');
    expect(store.filteredStudents()).toEqual([]);
  });

  it('filters present students by attendance summary ids', () => {
    store.setAttendanceFilter('present');

    expect(store.filteredStudents().map((student) => student.id)).toEqual(['student-1']);
    expect(store.emptyStateTitle()).toBe('No present students found');
  });

  it('clears attendance filtering without clearing search or advanced filters', () => {
    store.searchQuery.set('sara');
    store.statusFilter.set('Inactive');
    store.setAttendanceFilter('absent');

    store.setAttendanceFilter('all');

    expect(store.attendanceFilter()).toBe('all');
    expect(store.searchQuery()).toBe('sara');
    expect(store.statusFilter()).toBe('Inactive');
    expect(store.filteredStudents().map((student) => student.id)).toEqual(['student-2']);
  });

  it('keeps the full list usable when attendance summary loading fails', () => {
    dataService.loadAttendanceSummary.mockReturnValueOnce(throwError(() => new Error('Summary unavailable')));
    store.setAttendanceFilter('present');

    store.loadAttendanceSummary();

    expect(store.attendanceSummary()).toBeNull();
    expect(store.attendanceSummaryError()).toBe('Summary unavailable');
    expect(store.attendanceFilter()).toBe('all');
    expect(store.filteredStudents()).toHaveLength(3);
    expect(store.attendanceCards().find((card) => card.key === 'absent')?.disabled).toBe(true);
  });
});
