import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import { TenantOverviewFacade } from '../../state/tenant-overview.facade';
import { OverviewChartSeries, OverviewKpi, TenantOverviewRange } from '../../models/tenant-overview.models';

Chart.register(...registerables);

interface TenantQuickAction {
  label: string;
  icon: string;
  color: string;
  route: string;
  requiredPermission: string;
}

const REQUIRED_KPI_CARDS: OverviewKpi[] = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    value: '0',
    numericValue: 0,
    trend: null,
    subtext: '0 teachers',
    icon: 'school',
    bgClass: 'bg-indigo-600/10 dark:bg-indigo-900/20',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'activeGroups',
    label: 'Active Groups',
    value: '0',
    numericValue: 0,
    trend: null,
    subtext: 'Active classes',
    icon: 'groups',
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'todaySessions',
    label: 'Today Sessions',
    value: '0',
    numericValue: 0,
    trend: null,
    subtext: 'Scheduled groups',
    icon: 'event',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'attendanceRate',
    label: 'Attendance Rate',
    value: '0%',
    numericValue: 0,
    trend: null,
    subtext: "Today's records",
    icon: 'fact_check',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'overduePayments',
    label: 'Overdue Payments',
    value: '$0.00',
    numericValue: 0,
    trend: null,
    subtext: '0 unpaid invoices',
    icon: 'money_off',
    bgClass: 'bg-rose-50 dark:bg-rose-900/20',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
];

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.css',
})
export class TenantDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly permissions = inject(TenantPermissionService);
  readonly overview = inject(TenantOverviewFacade);

  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  private attendanceChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private viewInitialized = false;

  readonly kpiCards = computed(() => {
    const cardsByKey = new Map((this.overview.kpis() ?? []).map((card) => [card.key, card]));
    return REQUIRED_KPI_CARDS.map((fallback) => this.withRequiredKpiDefaults(cardsByKey.get(fallback.key), fallback));
  });
  readonly todaySessions = this.overview.todaySessions;
  readonly pendingPayments = this.overview.pendingPayments;
  readonly pendingPaymentCount = this.overview.pendingPaymentCount;

  readonly quickActions = computed(() =>
    this.allQuickActions.filter((action) => this.permissions.hasPermission(action.requiredPermission)),
  );

  private readonly allQuickActions: TenantQuickAction[] = [
    {
      label: 'Add Student',
      icon: 'person_add',
      color: 'text-indigo-600',
      route: '/tenant/students/create',
      requiredPermission: 'tenant.students.manage',
    },
    {
      label: 'Add Teacher',
      icon: 'person_add_alt_1',
      color: 'text-emerald-600',
      route: '/tenant/teachers/create',
      requiredPermission: 'tenant.teachers.manage',
    },
    {
      label: 'Create Group',
      icon: 'group_add',
      color: 'text-violet-500',
      route: '/tenant/groups/create',
      requiredPermission: 'tenant.groups.manage',
    },
  ];

  constructor() {
    effect(() => {
      const attendance = this.overview.attendanceTrend();
      const revenue = this.overview.revenueTrend();
      if (this.viewInitialized && isPlatformBrowser(this.platformId)) {
        this.updateAttendanceChart(attendance);
        this.updateRevenueChart(revenue);
      }
    });
  }

  ngOnInit(): void {
    this.overview.load();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.viewInitialized = true;
    this.updateAttendanceChart(this.overview.attendanceTrend());
    this.updateRevenueChart(this.overview.revenueTrend());
  }

  ngOnDestroy(): void {
    this.attendanceChart?.destroy();
    this.revenueChart?.destroy();
  }

  selectRange(range: TenantOverviewRange): void {
    this.overview.load(range);
  }

  navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Scheduled':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-500';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private updateAttendanceChart(series: OverviewChartSeries): void {
    if (!this.attendanceChartRef?.nativeElement) {
      return;
    }
    const data = series.datasets[0]?.data ?? [];
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          {
            label: series.datasets[0]?.label ?? 'Attendance %',
            data,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#6366f1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: { grid: { display: false } },
        },
      },
    };
    this.attendanceChart?.destroy();
    this.attendanceChart = new Chart(this.attendanceChartRef.nativeElement, config);
  }

  private withRequiredKpiDefaults(card: OverviewKpi | undefined, fallback: OverviewKpi): OverviewKpi {
    if (!card) {
      return fallback;
    }
    return {
      ...fallback,
      ...card,
      label: card.label?.trim() || fallback.label,
      value: card.value?.trim() || fallback.value,
      numericValue: card.numericValue ?? fallback.numericValue,
      trend: card.trend ?? fallback.trend,
      subtext: card.subtext?.trim() || fallback.subtext,
      icon: card.icon?.trim() || fallback.icon,
      bgClass: card.bgClass?.trim() || fallback.bgClass,
      iconClass: card.iconClass?.trim() || fallback.iconClass,
    };
  }

  private updateRevenueChart(series: OverviewChartSeries): void {
    if (!this.revenueChartRef?.nativeElement) {
      return;
    }
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          {
            label: series.datasets[0]?.label ?? 'Revenue',
            data: series.datasets[0]?.data ?? [],
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: { grid: { display: false } },
        },
      },
    };
    this.revenueChart?.destroy();
    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, config);
  }
}
