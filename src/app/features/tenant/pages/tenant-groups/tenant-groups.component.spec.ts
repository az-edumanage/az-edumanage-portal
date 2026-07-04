import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, computed, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { TenantGroupsFacade } from '../../state/tenant-groups.facade';
import { TenantGroupsComponent } from './tenant-groups.component';

describe('TenantGroupsComponent', () => {
  let fixture: ComponentFixture<TenantGroupsComponent>;
  let router: Router;
  let facade: Record<string, unknown> & {
    scheduleFilter: WritableSignal<'all' | 'today' | 'running' | 'postponed'>;
    selectScheduleFilter: ReturnType<typeof vi.fn>;
    requestDelete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const groups = signal([
      {
        id: 'group-1',
        name: 'Physics G12-A',
        teacher: 'Dr. Ahmed Zewail',
        subject: 'Physics',
        studentsCount: 0,
        schedule: 'Monday 10:00',
        startAt: '10:00',
        duration: 90,
        room: 'Lab 101',
      },
    ]);
    const scheduleFilter = signal<'all' | 'today' | 'running' | 'postponed'>('all');
    facade = {
      searchQuery: signal(''),
      showFilterPanel: signal(false),
      viewMode: signal<'grid' | 'list'>('list'),
      scheduleSummary: signal({
        totalGroups: 1,
        todayGroups: 1,
        currentRunningGroups: 0,
        postponedGroups: 0,
        todayGroupIds: ['group-1'],
        currentRunningGroupIds: [],
        postponedGroupIds: [],
        today: '2026-06-29',
        asOf: '2026-06-29T11:30:00+03:00',
        unavailableReason: null,
      }),
      scheduleSummaryLoading: signal(false),
      scheduleSummaryError: signal<string | null>(null),
      scheduleFilter,
      activeScheduleFilterLabel: computed(() => scheduleFilter() === 'all' ? 'Total Groups' : "Today's Groups"),
      hasScheduleFilter: computed(() => scheduleFilter() !== 'all'),
      groups,
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
      activeFiltersCount: computed(() => 0),
      filteredGroups: groups,
      pagedGroups: groups,
      totalFilteredGroups: computed(() => groups().length),
      totalPages: computed(() => 1),
      pageIndex: signal(0),
      pageSize: signal(10),
      pageStart: computed(() => 1),
      pageEnd: computed(() => groups().length),
      deleteState: signal({ status: 'closed', group: null, message: '' }),
      loadGroups: vi.fn(),
      loadScheduleSummary: vi.fn(),
      setFilters: vi.fn(),
      clearAllFilters: vi.fn(),
      clearAdvancedFilters: vi.fn(),
      setSearchQuery: vi.fn(),
      nextPage: vi.fn(),
      previousPage: vi.fn(),
      setPageSize: vi.fn(),
      toggleFilterPanel: vi.fn(),
      selectScheduleFilter: vi.fn((filter: 'all' | 'today' | 'running' | 'postponed') => scheduleFilter.set(filter)),
      requestDelete: vi.fn(),
      closeDeleteModal: vi.fn(),
      confirmDelete: vi.fn(),
    } as unknown as typeof facade;

    await TestBed.configureTestingModule({
      imports: [TenantGroupsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantGroupsFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupsComponent);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('renders schedule summary cards and wires card clicks', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('.schedule-summary-card')] as HTMLButtonElement[];

    expect(buttons[0].textContent).toContain('Total Groups');
    expect(buttons[0].textContent).toContain('1');
    expect(buttons[1].textContent).toContain("Today's Groups");
    expect(buttons[1].textContent).toContain('1');
    expect(buttons[2].textContent).toContain('Current Running Groups');
    expect(buttons[2].textContent).toContain('0');
    expect(buttons[3].textContent).toContain('Postponed Groups');
    expect(buttons[3].textContent).toContain('0');

    buttons[1].click();
    fixture.detectChanges();

    expect(facade.selectScheduleFilter).toHaveBeenCalledWith('today');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps manage, edit, and delete row actions available', () => {
    const manageLink = fixture.nativeElement.querySelector('a[title="Manage"]');
    const editLink = fixture.nativeElement.querySelector('a[title="Edit"]');
    const deleteButton = fixture.nativeElement.querySelector('button[title="Delete group"]') as HTMLButtonElement;

    expect(manageLink).toBeTruthy();
    expect(editLink).toBeTruthy();

    deleteButton.click();

    expect(facade.requestDelete).toHaveBeenCalledWith('group-1');
  });

  it('opens group details when the table row is clicked', () => {
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    row.click();

    expect(router.navigate).toHaveBeenCalledWith(['/tenant/groups', 'group-1']);
  });
});
