export type TenantOverviewRange = 'today' | 'week' | 'month';
export type TenantRevenueTrendRange = 'week' | 'month';

export interface TenantOverviewView {
  generatedAt: string;
  range: TenantOverviewRange;
  kpis: OverviewKpi[];
  attendanceTrend: OverviewChartSeries;
  revenueTrend: OverviewChartSeries;
  todaySessions: TodaySession[];
  runningGroups: RunningGroup[];
  rooms: RoomOccupancy;
  pendingPayments: PendingPayment[];
  pendingPaymentCount: number;
  sectionErrors: OverviewSectionError[];
}

export interface OverviewKpi {
  key: string;
  label: string;
  value: string;
  numericValue: number;
  trend: number | null;
  subtext: string | null;
  icon: string;
  bgClass: string;
  iconClass: string;
}

export interface OverviewChartSeries {
  labels: string[];
  datasets: OverviewChartDataset[];
}

export interface OverviewChartDataset {
  label: string;
  data: number[];
}

export interface TodaySession {
  id: string;
  time: string;
  group: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | string;
}

export interface RunningGroup {
  id: string;
  group: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  endsAt: string;
}

export interface RoomOccupancy {
  occupiedRooms: number;
  freeRooms: number;
  freeHours: string;
  freeHoursValue: number;
  operatingWindow: string;
}

export interface PendingPayment {
  invoiceId: string;
  student: string;
  amount: string;
  amountValue: number;
  currency: string;
  dueDate: string;
}

export interface OverviewSectionError {
  section: 'kpis' | 'attendanceTrend' | 'revenueTrend' | 'todaySessions' | 'runningGroups' | 'rooms' | 'pendingPayments' | string;
  message: string;
}

export interface TenantOverviewState {
  status: 'idle' | 'loading' | 'loaded' | 'unavailable';
  range: TenantOverviewRange;
  revenueTrendRange: TenantRevenueTrendRange;
  data: TenantOverviewView | null;
  error: string | null;
}
