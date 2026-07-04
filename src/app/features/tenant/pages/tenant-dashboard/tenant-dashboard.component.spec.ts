import { PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { OverviewKpi, RunningGroup, TenantOverviewView, TodaySession } from '../../models/tenant-overview.models';
import { TenantOverviewFacade } from '../../state/tenant-overview.facade';
import { TenantDashboardComponent } from './tenant-dashboard.component';

describe('TenantDashboardComponent', () => {
  let granted: Set<string>;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let kpis: WritableSignal<OverviewKpi[]>;
  let data: WritableSignal<TenantOverviewView | null>;
  let status: WritableSignal<string>;
  let range: WritableSignal<'today' | 'week' | 'month'>;
  let isLoading: WritableSignal<boolean>;
  let isUnavailable: WritableSignal<boolean>;
  let todaySessions: WritableSignal<TodaySession[]>;
  let runningGroups: WritableSignal<RunningGroup[]>;
  let loadOverview: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    granted = new Set(['tenant.students.manage', 'tenant.teachers.manage', 'tenant.groups.manage', 'tenant.attendance.view']);
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    kpis = signal([]);
    data = signal(null);
    status = signal('loaded');
    range = signal('today');
    isLoading = signal(false);
    isUnavailable = signal(false);
    todaySessions = signal([]);
    runningGroups = signal([]);
    loadOverview = vi.fn();
    TestBed.configureTestingModule({
      imports: [TenantDashboardComponent],
      providers: [
        {
          provide: TenantOverviewFacade,
          useValue: {
            status,
            range,
            revenueTrendRange: signal('month'),
            data,
            error: signal(null),
            isLoading,
            isUnavailable,
            kpis,
            attendanceTrend: signal({ labels: [], datasets: [] }),
            revenueTrend: signal({ labels: [], datasets: [] }),
            todaySessions,
            runningGroups,
            rooms: signal({
              occupiedRooms: 0,
              freeRooms: 0,
              freeHours: '0h',
              freeHoursValue: 0,
              operatingWindow: '08:00 AM - 08:00 PM',
            }),
            pendingPayments: signal([]),
            pendingPaymentCount: signal(0),
            load: loadOverview,
          },
        },
        {
          provide: TenantPermissionService,
          useValue: { hasPermission: (permission?: string | null) => !permission || granted.has(permission) },
        },
        {
          provide: AuthIdentityService,
          useValue: { username: signal('tenant-admin') },
        },
        {
          provide: TenantGroupAttendanceDataService,
          useValue: {
            scanBarcode: vi.fn().mockReturnValue(of({
              result: 'PRESENT_RECORDED',
              message: 'Attendance recorded',
              student: null,
              group: null,
              attendance: null,
            })),
          },
        },
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
  });

  it('renders the five required KPI labels from facade data', () => {
    kpis.set(requiredKpis());
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total Students');
    expect(text).toContain('Active Groups');
    expect(text).toContain('Today Sessions');
    expect(text).toContain('Total Teachers');
    expect(text).toContain('Overdue Payments');
    expect(text).toContain('1,248');
    expect(text).toContain('42');
    expect(text).toContain('$3,450.00');
  });

  it('preserves the KPI row when the facade starts in loading state', () => {
    status.set('loading');
    isLoading.set(true);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const labels = fixture.componentInstance.kpiCards().map((card) => card.label);
    expect(labels).toEqual(['Total Students', 'Active Groups', 'Today Sessions', 'Total Teachers', 'Overdue Payments']);
    expect(fixture.nativeElement.textContent).toContain('$0.00');
  });

  it('renders five neutral KPI cards when overview data is unavailable or empty', () => {
    status.set('unavailable');
    isUnavailable.set(true);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const cards = fixture.componentInstance.kpiCards();
    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.key)).toEqual(['totalStudents', 'activeGroups', 'todaySessions', 'totalTeachers', 'overduePayments']);
    expect(cards.map((card) => card.value)).toEqual(['0', '0', '0', '0', '$0.00']);
  });

  it('opens student, group, and teacher lists from clickable KPI cards', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button[aria-label^="Open "]')) as HTMLButtonElement[];
    buttons.find((button) => button.getAttribute('aria-label') === 'Open Total Students')?.click();
    buttons.find((button) => button.getAttribute('aria-label') === 'Open Active Groups')?.click();
    buttons.find((button) => button.getAttribute('aria-label') === 'Open Total Teachers')?.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/students');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/groups');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/teachers');
  });

  it('exports the report from the header action when overview data exists', () => {
    data.set(overviewResponse());
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const exportSpy = vi.spyOn(component, 'exportReport').mockImplementation(() => undefined);

    const button = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find((candidate) => candidate.textContent?.includes('Export Report')) as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(false);
    expect(exportSpy).toHaveBeenCalledOnce();
  });

  it('shows report preview modal with download and close actions', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    const component = fixture.componentInstance;
    const sanitizer = TestBed.inject(DomSanitizer);
    component.reportPreviewUrl.set(sanitizer.bypassSecurityTrustResourceUrl('blob:overview-report'));
    component.reportFileName.set('tenant-overview-report-2026-06-29.pdf');
    const downloadSpy = vi.spyOn(component, 'downloadReport').mockImplementation(() => undefined);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Center Overview Report');
    expect(text).toContain('tenant-overview-report-2026-06-29.pdf');
    const downloadButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.includes('Download PDF')) as HTMLButtonElement;
    downloadButton.click();
    expect(downloadSpy).toHaveBeenCalledOnce();

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close report preview"]') as HTMLButtonElement;
    closeButton.click();
    expect(component.reportPreviewUrl()).toBeNull();
  });

  it('shows Attendance, Add Student, Add Teacher, and Create Group quick actions without removed actions', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    const labels = fixture.componentInstance.quickActions().map((action) => action.label);

    expect(labels).toEqual(['Attendance', 'Add Student', 'Add Teacher', 'Create Group']);
    expect(labels).not.toContain('New Session');
    expect(labels).not.toContain('Record Pay');
  });

  it('renders running groups and room occupancy sections', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Runing Group');
    expect(text).toContain('No groups are running now.');
    expect(text).toContain('Rooms');
    expect(text).toContain('Occupied rooms');
    expect(text).toContain('Free rooms');
    expect(text).toContain('Free hours today');
  });

  it('paginates today sessions with five visible rows per page', () => {
    todaySessions.set(Array.from({ length: 6 }, (_, index) => ({
      id: `session-${index + 1}`,
      time: `${String(index + 8).padStart(2, '0')}:00`,
      group: `Group ${index + 1}`,
      subject: 'Science',
      teacher: 'Ahmed Zewail',
      room: 'Room 101',
      status: 'Scheduled',
    })));
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 1-5 of 6 sessions');
    expect(fixture.nativeElement.textContent).toContain('Rows');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 2');
    expect(fixture.nativeElement.textContent).toContain('Group 1');
    expect(fixture.nativeElement.textContent).not.toContain('Group 6');

    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Next today\'s sessions page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 6-6 of 6 sessions');
    expect(fixture.nativeElement.textContent).toContain('Group 6');

    const rowsSelect = fixture.nativeElement.querySelector('select[aria-label="Today sessions rows per page"]') as HTMLSelectElement;
    rowsSelect.value = '10';
    rowsSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 1-6 of 6 sessions');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 1');
  });

  it('renders in-progress today sessions before the other session statuses', () => {
    todaySessions.set([
      {
        id: 'completed-session',
        time: '10:00 AM',
        group: 'Completed Group',
        subject: 'Science',
        teacher: 'Ahmed Zewail',
        room: 'Room 101',
        status: 'Completed',
      },
      {
        id: 'scheduled-session',
        time: '04:00 PM',
        group: 'Scheduled Group',
        subject: 'Science',
        teacher: 'Ahmed Zewail',
        room: 'Room 102',
        status: 'Scheduled',
      },
      {
        id: 'running-session',
        time: '03:45 PM',
        group: 'Running Group',
        subject: 'Science',
        teacher: 'Ahmed Zewail',
        room: 'Room 103',
        status: 'In Progress',
      },
    ]);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const firstSessionRow = fixture.nativeElement.querySelector('table tbody tr') as HTMLTableRowElement;
    expect(firstSessionRow.textContent).toContain('Running Group');
    expect(firstSessionRow.textContent).toContain('In Progress');
  });

  it('paginates running groups with five visible rows per page', () => {
    runningGroups.set(Array.from({ length: 6 }, (_, index) => ({
      id: `group-${index + 1}`,
      group: `Running Group ${index + 1}`,
      subject: 'Science',
      teacher: 'Ahmed Zewail',
      room: 'Room 101',
      time: '10:00',
      endsAt: '11:30',
    })));
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 1-5 of 6 groups');
    expect(fixture.nativeElement.textContent).toContain('Rows');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 2');
    expect(fixture.nativeElement.textContent).toContain('Running Group 1');
    expect(fixture.nativeElement.textContent).not.toContain('Running Group 6');

    const nextButton = fixture.nativeElement.querySelector('button[aria-label="Next running groups page"]') as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 6-6 of 6 groups');
    expect(fixture.nativeElement.textContent).toContain('Running Group 6');

    const rowsSelect = fixture.nativeElement.querySelector('select[aria-label="Running groups rows per page"]') as HTMLSelectElement;
    rowsSelect.value = '10';
    rowsSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Showing 1-6 of 6 groups');
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 1');
  });

  it('filters quick actions by tenant permissions', () => {
    granted = new Set(['tenant.students.manage']);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    expect(fixture.componentInstance.quickActions().map((action) => action.label)).toEqual(['Add Student']);
  });

  it('navigates to selected quick action route', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.componentInstance.runQuickAction({
      label: 'Add Teacher',
      icon: 'person_add_alt_1',
      color: 'text-emerald-600',
      route: '/tenant/teachers/create',
      requiredPermission: 'tenant.teachers.manage',
    });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/teachers/create');
  });

  it('opens the overview attendance barcode modal from the Attendance quick action', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.componentInstance.runQuickAction({
      label: 'Attendance',
      icon: 'qr_code_scanner',
      color: 'text-fuchsia-600',
      action: 'attendance',
      requiredPermission: 'tenant.attendance.view',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.attendanceScannerOpen()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Student Barcode Reader');
    expect(fixture.nativeElement.textContent).toContain('Electronic Barcode Reader');
    expect(fixture.nativeElement.textContent).toContain('Read Barcode Data Input');
  });

  it('routes View All Debts to tenant billing', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();

    const viewAllDebtsButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.includes('View All Debts')) as HTMLButtonElement;
    viewAllDebtsButton.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/billing');
  });

  it('reloads overview with weekly revenue trend when This Week is selected', () => {
    range.set('month');
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();

    const revenueSelect = fixture.nativeElement.querySelector('select[aria-label="Revenue trend range"]') as HTMLSelectElement;
    revenueSelect.value = 'week';
    revenueSelect.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.revenueTrendRange()).toBe('week');
    expect(loadOverview).toHaveBeenCalledWith('month', 'week');
  });
});

function requiredKpis(): OverviewKpi[] {
  return [
    {
      key: 'totalStudents',
      label: 'Total Students',
      value: '1,248',
      numericValue: 1248,
      trend: 12,
      subtext: '42 this month',
      icon: 'school',
      bgClass: 'bg-indigo-600/10',
      iconClass: 'text-indigo-600',
    },
    {
      key: 'activeGroups',
      label: 'Active Groups',
      value: '42',
      numericValue: 42,
      trend: 5,
      subtext: 'Across 8 levels',
      icon: 'groups',
      bgClass: 'bg-violet-50',
      iconClass: 'text-violet-600',
    },
    {
      key: 'todaySessions',
      label: 'Today Sessions',
      value: '18',
      numericValue: 18,
      trend: null,
      subtext: '6 completed so far',
      icon: 'event',
      bgClass: 'bg-amber-50',
      iconClass: 'text-amber-600',
    },
    {
      key: 'totalTeachers',
      label: 'Total Teachers',
      value: '42',
      numericValue: 42,
      trend: 2.4,
      subtext: 'Teaching staff',
      icon: 'person',
      bgClass: 'bg-emerald-50',
      iconClass: 'text-emerald-600',
    },
    {
      key: 'overduePayments',
      label: 'Overdue Payments',
      value: '$3,450.00',
      numericValue: 3450,
      trend: -8,
      subtext: '15 students pending',
      icon: 'money_off',
      bgClass: 'bg-rose-50',
      iconClass: 'text-rose-600',
    },
  ];
}

function overviewResponse(): TenantOverviewView {
  return {
    generatedAt: '2026-06-29T08:00:00Z',
    range: 'today',
    kpis: requiredKpis(),
    attendanceTrend: { labels: ['Mon'], datasets: [{ label: 'Attendance %', data: [90] }] },
    revenueTrend: { labels: ['Week 1'], datasets: [{ label: 'Revenue', data: [500] }] },
    todaySessions: [],
    runningGroups: [],
    rooms: {
      occupiedRooms: 0,
      freeRooms: 0,
      freeHours: '0h',
      freeHoursValue: 0,
      operatingWindow: '08:00 AM - 08:00 PM',
    },
    pendingPayments: [],
    pendingPaymentCount: 0,
    sectionErrors: [],
  };
}
