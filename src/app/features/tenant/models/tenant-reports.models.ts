export type TenantReportSource =
  | 'students'
  | 'attendance'
  | 'teachers'
  | 'groups'
  | 'parents'
  | 'billing'
  | 'revenue'
  | 'exams'
  | 'invoices';

export type TenantReportDateRange = 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom';

export type TenantReportFilterOperator =
  | 'equals'
  | 'contains'
  | 'starts-with'
  | 'ends-with'
  | 'greater-than'
  | 'less-than'
  | 'between'
  | 'is-empty'
  | 'is-not-empty';

export interface TenantReportColumn {
  id: string;
  label: string;
  selected: boolean;
}

export interface TenantReportFilterOption {
  id: string;
  label: string;
  selected: boolean;
  field: string;
  operator: TenantReportFilterOperator;
  value: string;
}

export interface TenantReportTemplate {
  id: string;
  categoryId: TenantReportSource;
  name: string;
  description: string;
  icon: string;
  columns: TenantReportColumn[];
  filters: TenantReportFilterOption[];
  defaultDateRange: TenantReportDateRange;
}

export interface TenantReportFilter {
  field: string;
  operator: TenantReportFilterOperator;
  value: string;
  valueTo?: string;
}

export interface TenantReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TenantReportPreviewRequest {
  name: string;
  dataSource: TenantReportSource;
  columns: string[];
  filters: TenantReportFilter[];
  sorting: TenantReportSorting;
  dateRange: TenantReportDateRange;
  advancedOptions?: Record<string, unknown>;
  page?: number;
  size?: number;
}

export interface TenantReportSaveRequest {
  name: string;
  description?: string;
  module: TenantReportSource;
  dataSource: TenantReportSource;
  columns: string[];
  filters: TenantReportFilter[];
  sorting: TenantReportSorting;
  dateRange: TenantReportDateRange;
  advancedOptions?: Record<string, unknown>;
}

export interface TenantReportMetric {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'success';
}

export interface TenantReportChart {
  labels: string[];
  series: string[];
  values: number[];
}

export interface TenantReportPreview {
  title: string;
  dataSource: TenantReportSource;
  columns: string[];
  summaryCards: TenantReportMetric[];
  chart: TenantReportChart;
  rows: Record<string, unknown>[];
  page: number;
  size: number;
  totalItems: number;
  empty: boolean;
}

export interface TenantSavedReport {
  id: string;
  name: string;
  description?: string;
  module: TenantReportSource;
  dataSource: TenantReportSource;
  dateRange: TenantReportDateRange;
  favorite: boolean;
  icon: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  columns?: string[];
  filters?: TenantReportFilter[];
  sorting?: TenantReportSorting;
  advancedOptions?: Record<string, unknown>;
}
