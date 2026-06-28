import { PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import { OverviewKpi } from '../../models/tenant-overview.models';
import { TenantOverviewFacade } from '../../state/tenant-overview.facade';
import { TenantDashboardComponent } from './tenant-dashboard.component';

describe('TenantDashboardComponent', () => {
  let granted: Set<string>;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let kpis: WritableSignal<OverviewKpi[]>;
  let status: WritableSignal<string>;
  let isLoading: WritableSignal<boolean>;
  let isUnavailable: WritableSignal<boolean>;

  beforeEach(() => {
    granted = new Set(['tenant.students.manage', 'tenant.teachers.manage', 'tenant.groups.manage']);
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    kpis = signal([]);
    status = signal('loaded');
    isLoading = signal(false);
    isUnavailable = signal(false);
    TestBed.configureTestingModule({
      imports: [TenantDashboardComponent],
      providers: [
        {
          provide: TenantOverviewFacade,
          useValue: {
            status,
            range: signal('today'),
            data: signal(null),
            error: signal(null),
            isLoading,
            isUnavailable,
            kpis,
            attendanceTrend: signal({ labels: [], datasets: [] }),
            revenueTrend: signal({ labels: [], datasets: [] }),
            todaySessions: signal([]),
            pendingPayments: signal([]),
            pendingPaymentCount: signal(0),
            load: vi.fn(),
          },
        },
        {
          provide: TenantPermissionService,
          useValue: { hasPermission: (permission?: string | null) => !permission || granted.has(permission) },
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
    expect(text).toContain('Attendance Rate');
    expect(text).toContain('Overdue Payments');
    expect(text).toContain('1,248');
    expect(text).toContain('$3,450.00');
  });

  it('preserves the KPI row when the facade starts in loading state', () => {
    status.set('loading');
    isLoading.set(true);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const labels = fixture.componentInstance.kpiCards().map((card) => card.label);
    expect(labels).toEqual(['Total Students', 'Active Groups', 'Today Sessions', 'Attendance Rate', 'Overdue Payments']);
    expect(fixture.nativeElement.textContent).toContain('$0.00');
  });

  it('renders five neutral KPI cards when overview data is unavailable or empty', () => {
    status.set('unavailable');
    isUnavailable.set(true);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.detectChanges();

    const cards = fixture.componentInstance.kpiCards();
    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.key)).toEqual(['totalStudents', 'activeGroups', 'todaySessions', 'attendanceRate', 'overduePayments']);
    expect(cards.map((card) => card.value)).toEqual(['0', '0', '0', '0%', '$0.00']);
  });

  it('shows Add Student, Add Teacher, and Create Group quick actions without removed actions', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    const labels = fixture.componentInstance.quickActions().map((action) => action.label);

    expect(labels).toEqual(['Add Student', 'Add Teacher', 'Create Group']);
    expect(labels).not.toContain('New Session');
    expect(labels).not.toContain('Record Pay');
  });

  it('filters quick actions by tenant permissions', () => {
    granted = new Set(['tenant.students.manage']);
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    expect(fixture.componentInstance.quickActions().map((action) => action.label)).toEqual(['Add Student']);
  });

  it('navigates to selected quick action route', () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);

    fixture.componentInstance.navigateTo('/tenant/teachers/create');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/teachers/create');
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
      key: 'attendanceRate',
      label: 'Attendance Rate',
      value: '94.2%',
      numericValue: 94.2,
      trend: 2.4,
      subtext: 'Weekly average',
      icon: 'fact_check',
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
