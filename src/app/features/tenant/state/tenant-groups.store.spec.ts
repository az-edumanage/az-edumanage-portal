import { TestBed } from '@angular/core/testing';
import { TenantGroupsStore } from './tenant-groups.store';

describe('TenantGroupsStore', () => {
  let store: TenantGroupsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupsStore);
    store.groups.set([
      {
        id: '1',
        name: 'Physics G12-A',
        teacher: 'Dr. Ahmed Zewail',
        subject: 'Physics',
        studentsCount: 24,
        schedule: 'Mon, Wed 10:00 AM',
        room: 'Lab 101',
      },
      {
        id: '2',
        name: 'Biology Intro',
        teacher: 'Ms. Fatma Ali',
        subject: 'Biology',
        studentsCount: 30,
        schedule: 'Mon, Thu 12:00 PM',
        room: 'Room 301',
      },
      {
        id: '3',
        name: 'Chemistry Advanced',
        teacher: 'Mr. Khaled Said',
        subject: 'Chemistry',
        studentsCount: 18,
        schedule: 'Tue 02:00 PM',
        room: 'Lab 202',
      },
    ]);
  });

  it('uses list view by default', () => {
    expect(store.viewMode()).toBe('list');
  });

  it('filters groups by subject and teacher', () => {
    store.subjectFilter.set('Physics');
    store.teacherFilter.set('Dr. Ahmed Zewail');

    const filtered = store.filteredGroups();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Physics G12-A');
  });

  it('sorts by student count descending', () => {
    store.sortBy.set('students-desc');
    const filtered = store.filteredGroups();
    expect(filtered[0].studentsCount).toBe(30);
  });

  it('paginates filtered groups', () => {
    store.setPageSize(2);

    expect(store.totalFilteredGroups()).toBe(3);
    expect(store.totalPages()).toBe(2);
    expect(store.pageStart()).toBe(1);
    expect(store.pageEnd()).toBe(2);
    expect(store.pagedGroups().length).toBe(2);

    store.setPageIndex(1);

    expect(store.pageStart()).toBe(3);
    expect(store.pageEnd()).toBe(3);
    expect(store.pagedGroups().length).toBe(1);
  });
});
