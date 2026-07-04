import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantGroupsDataService } from '../data-access/tenant-groups-data.service';
import { TenantGroupsStore } from './tenant-groups.store';

describe('TenantGroupsStore', () => {
  let store: TenantGroupsStore;
  let dataService: {
    loadGroups: ReturnType<typeof vi.fn>;
    loadScheduleSummary: ReturnType<typeof vi.fn>;
    deleteGroup: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      loadGroups: vi.fn(() => of([])),
      loadScheduleSummary: vi.fn(() => of({
        totalGroups: 3,
        todayGroups: 2,
        currentRunningGroups: 1,
        postponedGroups: 1,
        todayGroupIds: ['1', '2'],
        currentRunningGroupIds: ['2'],
        postponedGroupIds: ['3'],
        today: '2026-06-29',
        asOf: '2026-06-29T11:30:00+03:00',
        unavailableReason: null,
      })),
      deleteGroup: vi.fn(() => of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TenantGroupsDataService, useValue: dataService }],
    });
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

  it('loads schedule summary state', () => {
    store.loadScheduleSummary();

    expect(dataService.loadScheduleSummary).toHaveBeenCalled();
    expect(store.scheduleSummary()?.todayGroups).toBe(2);
    expect(store.scheduleSummaryLoading()).toBe(false);
    expect(store.scheduleSummaryError()).toBeNull();
  });

  it('keeps the group list usable when schedule summary loading fails', () => {
    dataService.loadScheduleSummary.mockReturnValueOnce(throwError(() => new Error('Summary unavailable')));

    store.loadScheduleSummary();

    expect(store.scheduleSummary()).toBeNull();
    expect(store.scheduleSummaryError()).toBe('Summary unavailable');
    expect(store.filteredGroups().length).toBe(3);
  });

  it('filters groups by today schedule card and keeps search refinement', () => {
    store.loadScheduleSummary();
    store.selectScheduleFilter('today');
    store.searchQuery.set('Physics');

    expect(store.filteredGroups().map((group) => group.id)).toEqual(['1']);
    expect(store.activeScheduleFilterLabel()).toBe("Today's Groups");
  });

  it('filters running and postponed groups from backend summary ids', () => {
    store.loadScheduleSummary();

    store.selectScheduleFilter('running');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['2']);

    store.selectScheduleFilter('postponed');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['3']);
  });

  it('returns to all groups when total groups card is selected', () => {
    store.loadScheduleSummary();
    store.selectScheduleFilter('postponed');
    expect(store.filteredGroups().length).toBe(1);

    store.selectScheduleFilter('all');

    expect(store.filteredGroups().length).toBe(3);
    expect(store.hasScheduleFilter()).toBe(false);
  });

  it('opens delete confirmation for groups without students', () => {
    const emptyGroup = { ...store.groups()[0], studentsCount: 0 };

    store.requestDelete(emptyGroup);

    expect(store.deleteState()).toEqual({
      status: 'confirming',
      group: emptyGroup,
      message: '',
    });
  });

  it('blocks delete confirmation for groups with students', () => {
    const groupWithStudents = store.groups()[0];

    store.requestDelete(groupWithStudents);

    expect(store.deleteState().status).toBe('failed');
    expect(store.deleteState().message).toBe('Group cannot be deleted while students are linked');
    expect(dataService.deleteGroup).not.toHaveBeenCalled();
  });

  it('deletes empty groups and removes them from the table rows', () => {
    const emptyGroup = { ...store.groups()[0], studentsCount: 0 };
    store.groups.update((groups) => groups.map((group) => (group.id === emptyGroup.id ? emptyGroup : group)));
    store.requestDelete(emptyGroup);

    store.confirmDelete();

    expect(dataService.deleteGroup).toHaveBeenCalledWith('1');
    expect(store.groups().some((group) => group.id === '1')).toBe(false);
    expect(store.deleteState().status).toBe('success');
    expect(store.deleteState().message).toBe('Group deleted successfully.');
  });
});
