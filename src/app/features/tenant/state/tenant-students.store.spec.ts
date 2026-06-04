import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantStudentsDataService } from '../data-access/tenant-students-data.service';
import { Student } from '../models/tenant-students.models';
import { TenantStudentsStore } from './tenant-students.store';

describe('TenantStudentsStore', () => {
  let store: TenantStudentsStore;
  let dataService: { loadStudents: ReturnType<typeof vi.fn> };

  const students: Student[] = [
    {
      id: 'student-1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 12',
      status: 'Active',
      enrollmentDate: '2024-01-10',
    },
    {
      id: 'student-2',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      grade: 'Grade 11',
      status: 'Inactive',
      enrollmentDate: '2023-09-15',
    },
    {
      id: 'student-3',
      name: 'Omar Hassan',
      email: 'omar@example.com',
      grade: 'Grade 10',
      status: 'Pending',
      enrollmentDate: '2023-10-20',
    },
  ];

  beforeEach(() => {
    dataService = { loadStudents: vi.fn().mockReturnValue(of(students)) };
    TestBed.configureTestingModule({
      providers: [
        { provide: TenantStudentsDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantStudentsStore);
    store.loadStudents();
  });

  it('filters by grade and status', () => {
    store.gradeFilter.set('Grade 12');
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
});
