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
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { TenantPermissionService } from '../../../../core/auth/tenant-permission.service';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { TenantBarcodeAttendancePaymentStatus, TenantBarcodeAttendanceScanResponse } from '../../models/tenant-group-attendance.models';
import { TenantOverviewFacade } from '../../state/tenant-overview.facade';
import { OverviewChartSeries, OverviewKpi, TenantOverviewRange, TenantRevenueTrendRange, TodaySession } from '../../models/tenant-overview.models';

Chart.register(...registerables);

interface TenantQuickAction {
  label: string;
  icon: string;
  color: string;
  route?: string;
  action?: 'attendance';
  requiredPermission: string;
}

type DashboardKpiCard = OverviewKpi & {
  route?: string;
};

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY?: number };
};

interface OverviewAttendancePaymentWarning {
  studentName: string;
  groupName: string;
  invoiceRef: string;
  amount: string;
  dueDate: string;
}

const REQUIRED_KPI_CARDS: DashboardKpiCard[] = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    value: '0',
    numericValue: 0,
    trend: null,
    subtext: 'Enrolled learners',
    icon: 'school',
    bgClass: 'bg-indigo-600/10 dark:bg-indigo-900/20',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    route: '/tenant/students',
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
    route: '/tenant/groups',
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
    key: 'totalTeachers',
    label: 'Total Teachers',
    value: '0',
    numericValue: 0,
    trend: null,
    subtext: 'Teaching staff',
    icon: 'person',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    route: '/tenant/teachers',
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
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.css',
})
export class TenantDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly identity = inject(AuthIdentityService);
  private readonly permissions = inject(TenantPermissionService);
  private readonly groupAttendanceDataService = inject(TenantGroupAttendanceDataService);
  readonly overview = inject(TenantOverviewFacade);

  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overviewBarcodeInput') private overviewBarcodeInput?: ElementRef<HTMLInputElement>;

  private attendanceChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private viewInitialized = false;
  private reportObjectUrl: string | null = null;
  private reportBlob: Blob | null = null;
  readonly isExportingReport = signal(false);
  readonly reportPreviewUrl = signal<SafeResourceUrl | null>(null);
  readonly reportFileName = signal('tenant-overview-report.pdf');
  readonly attendanceScannerOpen = signal(false);
  readonly overviewBarcodeInputValue = signal('');
  readonly overviewBarcodeScanInProgress = signal(false);
  readonly overviewBarcodeScanNotification = signal<{ message: string; state: 'success' | 'error' | 'info' } | null>(null);
  readonly overviewPaymentWarningDialog = signal<OverviewAttendancePaymentWarning | null>(null);
  readonly revenueTrendRange = signal<TenantRevenueTrendRange>('month');
  readonly todaySessionsPageIndex = signal(0);
  readonly runningGroupsPageIndex = signal(0);
  readonly todaySessionsPageSize = signal(5);
  readonly runningGroupsPageSize = signal(5);

  readonly kpiCards = computed(() => {
    const cardsByKey = new Map((this.overview.kpis() ?? []).map((card) => [card.key, card]));
    return REQUIRED_KPI_CARDS.map((fallback) => this.withRequiredKpiDefaults(cardsByKey.get(fallback.key), fallback));
  });
  readonly todaySessions = this.overview.todaySessions;
  readonly sortedTodaySessions = computed(() => this.sortTodaySessions(this.todaySessions()));
  readonly runningGroups = this.overview.runningGroups;
  readonly todaySessionsPageCount = computed(() => this.pageCount(this.sortedTodaySessions().length, this.todaySessionsPageSize()));
  readonly runningGroupsPageCount = computed(() => this.pageCount(this.runningGroups().length, this.runningGroupsPageSize()));
  readonly visibleTodaySessionsPageIndex = computed(() => this.clampedPageIndex(this.todaySessionsPageIndex(), this.todaySessionsPageCount()));
  readonly visibleRunningGroupsPageIndex = computed(() => this.clampedPageIndex(this.runningGroupsPageIndex(), this.runningGroupsPageCount()));
  readonly paginatedTodaySessions = computed(() => this.paginate(this.sortedTodaySessions(), this.visibleTodaySessionsPageIndex(), this.todaySessionsPageSize()));
  readonly paginatedRunningGroups = computed(() => this.paginate(this.runningGroups(), this.visibleRunningGroupsPageIndex(), this.runningGroupsPageSize()));
  readonly todaySessionsPageStart = computed(() => this.pageStart(this.sortedTodaySessions().length, this.visibleTodaySessionsPageIndex(), this.todaySessionsPageSize()));
  readonly todaySessionsPageEnd = computed(() => this.pageEnd(this.sortedTodaySessions().length, this.visibleTodaySessionsPageIndex(), this.todaySessionsPageSize()));
  readonly runningGroupsPageStart = computed(() => this.pageStart(this.runningGroups().length, this.visibleRunningGroupsPageIndex(), this.runningGroupsPageSize()));
  readonly runningGroupsPageEnd = computed(() => this.pageEnd(this.runningGroups().length, this.visibleRunningGroupsPageIndex(), this.runningGroupsPageSize()));
  readonly rooms = this.overview.rooms;
  readonly pendingPayments = this.overview.pendingPayments;
  readonly pendingPaymentCount = this.overview.pendingPaymentCount;

  readonly quickActions = computed(() =>
    this.allQuickActions.filter((action) => this.permissions.hasPermission(action.requiredPermission)),
  );

  private readonly allQuickActions: TenantQuickAction[] = [
    {
      label: 'Attendance',
      icon: 'qr_code_scanner',
      color: 'text-fuchsia-600',
      action: 'attendance',
      requiredPermission: 'tenant.attendance.view',
    },
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
    this.revokeReportPreview();
  }

  selectRange(range: TenantOverviewRange): void {
    this.todaySessionsPageIndex.set(0);
    this.runningGroupsPageIndex.set(0);
    this.overview.load(range, this.revenueTrendRange());
  }

  selectRevenueTrendRange(range: TenantRevenueTrendRange): void {
    this.revenueTrendRange.set(range === 'week' ? 'week' : 'month');
    this.overview.load(this.overview.range(), this.revenueTrendRange());
  }

  exportReport(): void {
    if (!isPlatformBrowser(this.platformId) || this.isExportingReport()) {
      return;
    }
    const data = this.overview.data();
    if (!data) {
      return;
    }

    this.isExportingReport.set(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4') as JsPdfWithAutoTable;
      const generatedDate = new Date();
      const tenantName = this.tenantReportName();
      const reportDate = generatedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const fileDate = generatedDate.toISOString().slice(0, 10);
      const fileName = `tenant-overview-report-${fileDate}.pdf`;

      this.drawReportHeader(doc, tenantName, reportDate, data.range);
      this.drawKpiSummary(doc, this.kpiCards());

      let y = 88;
      y = this.drawChart(doc, this.attendanceChart, 'Attendance Trend', 14, y, 86);
      y = Math.max(y, this.drawChart(doc, this.revenueChart, 'Revenue Trend', 110, 88, 86));

      y = Math.max(y, 145);
      y = this.drawTable(doc, 'Today\'s Sessions', ['Time', 'Group', 'Teacher', 'Room', 'Status'], this.todaySessions().map((session) => [
        session.time,
        session.group,
        session.teacher,
        session.room,
        session.status,
      ]), y);

      y = this.drawTable(doc, 'Running Groups', ['Group', 'Teacher', 'Room', 'Started', 'Ends'], this.runningGroups().map((group) => [
        group.group,
        group.teacher,
        group.room,
        group.time,
        group.endsAt,
      ]), y);

      y = this.drawTable(doc, 'Rooms', ['Metric', 'Value'], [
        ['Occupied rooms', String(this.rooms().occupiedRooms)],
        ['Free rooms', String(this.rooms().freeRooms)],
        ['Free hours today', this.rooms().freeHours],
        ['Operating window', this.rooms().operatingWindow],
      ], y);

      y = this.drawTable(doc, 'Pending Payments', ['Student', 'Amount', 'Due date'], this.pendingPayments().map((payment) => [
        payment.student,
        payment.amount,
        payment.dueDate,
      ]), y);

      this.drawReportFooter(doc);
      const blob = doc.output('blob');
      this.revokeReportPreview();
      this.reportBlob = blob;
      this.reportObjectUrl = URL.createObjectURL(blob);
      this.reportFileName.set(fileName);
      this.reportPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.reportObjectUrl));
    } finally {
      this.isExportingReport.set(false);
    }
  }

  downloadReport(): void {
    if (!isPlatformBrowser(this.platformId) || !this.reportBlob || !this.reportObjectUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.reportObjectUrl;
    link.download = this.reportFileName();
    link.rel = 'noopener';
    link.click();
  }

  closeReportPreview(): void {
    this.revokeReportPreview();
  }

  navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  runQuickAction(action: TenantQuickAction): void {
    if (action.action === 'attendance') {
      this.openAttendanceScanner();
      return;
    }

    if (action.route) {
      this.navigateTo(action.route);
    }
  }

  openAttendanceScanner(): void {
    this.attendanceScannerOpen.set(true);
    this.overviewBarcodeScanNotification.set(null);
    this.overviewPaymentWarningDialog.set(null);
    setTimeout(() => this.overviewBarcodeInput?.nativeElement.focus(), 0);
  }

  closeAttendanceScanner(): void {
    if (this.overviewBarcodeScanInProgress()) {
      return;
    }
    this.attendanceScannerOpen.set(false);
    this.overviewBarcodeInputValue.set('');
    this.overviewBarcodeScanNotification.set(null);
    this.overviewPaymentWarningDialog.set(null);
  }

  onOverviewBarcodeInput(value: string): void {
    this.overviewBarcodeInputValue.set(value);
  }

  submitOverviewBarcodeScan(): void {
    const barcodeNumber = this.overviewBarcodeInputValue().trim();
    if (!barcodeNumber) {
      this.overviewBarcodeScanNotification.set({ message: 'Barcode number is required', state: 'error' });
      this.focusOverviewBarcodeInput();
      return;
    }

    this.overviewBarcodeScanInProgress.set(true);
    this.overviewBarcodeScanNotification.set(null);
    this.groupAttendanceDataService.scanBarcode({ barcodeNumber, selectedGroupId: null }).subscribe({
      next: (response) => this.handleOverviewBarcodeScanResponse(response),
      error: (error: Error) => {
        this.overviewBarcodeScanInProgress.set(false);
        this.overviewBarcodeScanNotification.set({
          message: error.message || 'Unable to record barcode attendance',
          state: 'error',
        });
        this.focusOverviewBarcodeInput();
      },
    });
  }

  closeOverviewPaymentWarningDialog(): void {
    this.overviewPaymentWarningDialog.set(null);
    this.focusOverviewBarcodeInput();
  }

  openBilling(): void {
    void this.router.navigateByUrl('/tenant/billing');
  }

  previousTodaySessionsPage(): void {
    this.todaySessionsPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextTodaySessionsPage(): void {
    this.todaySessionsPageIndex.update((page) => Math.min(this.todaySessionsPageCount() - 1, page + 1));
  }

  previousRunningGroupsPage(): void {
    this.runningGroupsPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextRunningGroupsPage(): void {
    this.runningGroupsPageIndex.update((page) => Math.min(this.runningGroupsPageCount() - 1, page + 1));
  }

  setTodaySessionsPageSize(value: number | string): void {
    const size = Number(value);
    this.todaySessionsPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.todaySessionsPageIndex.set(0);
  }

  setRunningGroupsPageSize(value: number | string): void {
    const size = Number(value);
    this.runningGroupsPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.runningGroupsPageIndex.set(0);
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

  private sortTodaySessions(sessions: TodaySession[]): TodaySession[] {
    return sessions
      .map((session, index) => ({ session, index }))
      .sort((left, right) => {
        const statusRank = this.todaySessionStatusRank(left.session.status) - this.todaySessionStatusRank(right.session.status);
        return statusRank || left.index - right.index;
      })
      .map(({ session }) => session);
  }

  private todaySessionStatusRank(status: string): number {
    return status.trim().toLowerCase() === 'in progress' ? 0 : 1;
  }

  private handleOverviewBarcodeScanResponse(response: TenantBarcodeAttendanceScanResponse): void {
    this.overviewBarcodeScanInProgress.set(false);
    this.overviewBarcodeScanNotification.set({
      message: response.message,
      state: response.result === 'PRESENT_RECORDED' || response.result === 'ALREADY_PRESENT' ? 'success' : 'error',
    });

    if (response.result === 'PRESENT_RECORDED' || response.result === 'ALREADY_PRESENT') {
      this.overviewBarcodeInputValue.set('');
      if (this.overviewBarcodeInput?.nativeElement) {
        this.overviewBarcodeInput.nativeElement.value = '';
      }
      this.openOverviewPaymentWarningIfNeeded(response);
      this.overview.load(this.overview.range(), this.revenueTrendRange());
    }

    this.focusOverviewBarcodeInput();
  }

  private openOverviewPaymentWarningIfNeeded(response: TenantBarcodeAttendanceScanResponse): void {
    const groupId = response.group?.id;
    const paymentStatus = response.paymentStatus;
    if (!groupId || !response.student || !response.group || !this.shouldDisplayPaymentStatus(groupId) || !this.hasUnpaidInvoice(paymentStatus)) {
      this.overviewPaymentWarningDialog.set(null);
      return;
    }

    this.overviewPaymentWarningDialog.set({
      studentName: response.student.name,
      groupName: response.group.name,
      invoiceRef: paymentStatus.invoiceRef?.trim() || 'Unpaid invoice',
      amount: this.formatInvoiceAmount(paymentStatus.amount, paymentStatus.currency),
      dueDate: this.formatInvoiceDueDate(paymentStatus.dueDate),
    });
  }

  private focusOverviewBarcodeInput(): void {
    setTimeout(() => this.overviewBarcodeInput?.nativeElement.focus(), 0);
  }

  private hasUnpaidInvoice(paymentStatus: TenantBarcodeAttendancePaymentStatus | null | undefined): paymentStatus is TenantBarcodeAttendancePaymentStatus {
    return paymentStatus?.hasUnpaidSubscriptionInvoice === true;
  }

  private shouldDisplayPaymentStatus(groupId: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    try {
      return localStorage.getItem(this.displayPaymentStatusStorageKey(groupId)) === 'true';
    } catch {
      return false;
    }
  }

  private displayPaymentStatusStorageKey(groupId: string): string {
    return `tenant-group:${groupId}:display-payment-status`;
  }

  private formatInvoiceAmount(amount: number | string | null | undefined, currency: string | null | undefined): string {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return currency?.trim() || 'Amount not available';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency?.trim() || 'EGP',
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${numericAmount.toFixed(2)} ${currency?.trim() || 'EGP'}`;
    }
  }

  private formatInvoiceDueDate(dueDate: string | null | undefined): string {
    const normalized = dueDate?.trim();
    if (!normalized) {
      return 'Due date not available';
    }

    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return normalized;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
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

  private paginate<T>(items: T[], pageIndex: number, pageSize: number): T[] {
    const start = pageIndex * pageSize;
    return items.slice(start, start + pageSize);
  }

  private pageCount(totalItems: number, pageSize: number): number {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }

  private clampedPageIndex(pageIndex: number, pageCount: number): number {
    return Math.min(Math.max(0, pageIndex), Math.max(0, pageCount - 1));
  }

  private pageStart(totalItems: number, pageIndex: number, pageSize: number): number {
    return totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  }

  private pageEnd(totalItems: number, pageIndex: number, pageSize: number): number {
    return Math.min(totalItems, (pageIndex + 1) * pageSize);
  }

  private drawReportHeader(doc: jsPDF, tenantName: string, reportDate: string, range: string): void {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 5, 34, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(tenantName, 14, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated by ${this.identity.username() ?? 'Tenant user'}`, 14, 21);
    doc.text(`Scope: ${this.titleCase(range)} overview`, 14, 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('Center Overview Report', 196, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(reportDate, 196, 22, { align: 'right' });
    doc.text('Official operational summary', 196, 28, { align: 'right' });
  }

  private drawKpiSummary(doc: jsPDF, cards: DashboardKpiCard[]): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Executive Summary', 14, 45);

    const width = 35;
    cards.forEach((card, index) => {
      const x = 14 + index * 38;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, 50, width, 24, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3, 58, { maxWidth: width - 6 });
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, x + 3, 68, { maxWidth: width - 6 });
    });
  }

  private drawChart(doc: jsPDF, chart: Chart | null, title: string, x: number, y: number, width: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x, y);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y + 4, width, 45, 2, 2, 'FD');
    if (chart) {
      doc.addImage(chart.toBase64Image('image/png', 1), 'PNG', x + 3, y + 8, width - 6, 36);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Chart is not available in this session.', x + 5, y + 27);
    }
    return y + 57;
  }

  private drawTable(doc: JsPdfWithAutoTable, title: string, head: string[], body: RowInput[], startY: number): number {
    const y = this.ensurePageSpace(doc, startY, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 5,
      head: [head],
      body: body.length ? body : [head.map((_, index) => (index === 0 ? 'No records available' : ''))],
      theme: 'grid',
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    return (doc.lastAutoTable?.finalY ?? y + 15) + 10;
  }

  private ensurePageSpace(doc: jsPDF, y: number, required: number): number {
    if (y + required <= 278) {
      return y;
    }
    doc.addPage();
    return 18;
  }

  private drawReportFooter(doc: jsPDF): void {
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 286, 196, 286);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('AZ EduManage, tenant operational report', 14, 291);
      doc.text(`Page ${page} of ${totalPages}`, 196, 291, { align: 'right' });
    }
  }

  private tenantReportName(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'Tenant Center';
    }
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0] ?? '';
    if (subdomain && !['localhost', 'tenant', 'panel', 'api'].includes(subdomain)) {
      return this.titleCase(subdomain.replace(/[-_]+/g, ' '));
    }
    return 'Tenant Center';
  }

  private titleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private revokeReportPreview(): void {
    if (this.reportObjectUrl && isPlatformBrowser(this.platformId)) {
      URL.revokeObjectURL(this.reportObjectUrl);
    }
    this.reportObjectUrl = null;
    this.reportBlob = null;
    this.reportPreviewUrl.set(null);
  }

  private withRequiredKpiDefaults(card: OverviewKpi | undefined, fallback: DashboardKpiCard): DashboardKpiCard {
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
