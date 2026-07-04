import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { TenantReportsDataService } from '../../data-access/tenant-reports-data.service';
import {
  TenantReportColumn,
  TenantReportDateRange,
  TenantReportFilter,
  TenantReportFilterOperator,
  TenantReportPreview,
  TenantReportPreviewRequest,
  TenantReportSource,
  TenantReportTemplate,
  TenantSavedReport,
} from '../../models/tenant-reports.models';

type ReportTone = 'default' | 'warning' | 'success';
type SavedSort = 'recent' | 'alphabetical' | 'most-used' | 'favorites';
type CustomReportSource = TenantReportSource | '';

interface ReportCategory {
  id: TenantReportSource;
  name: string;
  icon: string;
  description: string;
}

interface CustomReportForm {
  name: string;
  source: CustomReportSource;
  columns: string[];
  filters: TenantReportFilter[];
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  dateRange: TenantReportDateRange;
}

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'students', name: 'Students', icon: 'school', description: 'Lists, balances, groups, teachers, and student status.' },
  { id: 'attendance', name: 'Attendance', icon: 'fact_check', description: 'Absence, presence, late students, and attendance rates.' },
  { id: 'teachers', name: 'Teachers', icon: 'badge', description: 'Teacher lists, workloads, salaries, and assigned groups.' },
  { id: 'groups', name: 'Groups', icon: 'groups', description: 'Group lists, schedules, rooms, capacity, and enrollment.' },
  { id: 'parents', name: 'Parents', icon: 'family_restroom', description: 'Parent contacts, linked students, and notification lists.' },
  { id: 'billing', name: 'Billing', icon: 'receipt_long', description: 'Invoices, unpaid balances, payment status, and collections.' },
  { id: 'revenue', name: 'Revenue', icon: 'monitoring', description: 'Revenue summaries by month, group, teacher, and branch.' },
  { id: 'exams', name: 'Exams', icon: 'assignment', description: 'Exam results, grades, passing rates, and performance.' },
];

const FILTER_OPERATORS: Array<{ value: TenantReportFilterOperator; label: string; requiresValue: boolean; requiresSecondValue?: boolean }> = [
  { value: 'equals', label: 'Equals', requiresValue: true },
  { value: 'contains', label: 'Contains', requiresValue: true },
  { value: 'starts-with', label: 'Starts With', requiresValue: true },
  { value: 'ends-with', label: 'Ends With', requiresValue: true },
  { value: 'greater-than', label: 'Greater Than', requiresValue: true },
  { value: 'less-than', label: 'Less Than', requiresValue: true },
  { value: 'between', label: 'Between', requiresValue: true, requiresSecondValue: true },
  { value: 'is-empty', label: 'Is Empty', requiresValue: false },
  { value: 'is-not-empty', label: 'Is Not Empty', requiresValue: false },
];

@Component({
  selector: 'app-report-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'report-summary-card',
    '[class.warning]': "tone() === 'warning'",
    '[class.success]': "tone() === 'success'",
  },
  template: `
    <span>{{ label() }}</span>
    <strong>{{ value() }}</strong>
  `,
})
export class ReportSummaryCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input<ReportTone>('default');
}

@Component({
  selector: 'app-tenant-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ReportSummaryCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-reports.component.html',
  styleUrl: './tenant-reports.component.css',
})
export class TenantReportsComponent implements OnInit {
  private readonly identity = inject(AuthIdentityService);
  private readonly reportsData = inject(TenantReportsDataService);
  private skipNextCustomPreview = false;

  readonly categories = signal(REPORT_CATEGORIES);
  readonly templates = signal<TenantReportTemplate[]>([]);
  readonly savedReports = signal<TenantSavedReport[]>([]);
  readonly activeCategoryId = signal<TenantReportSource>('students');
  readonly selectedTemplate = signal<TenantReportTemplate | null>(null);
  readonly templateFilters = signal<TenantReportFilter[]>([]);
  readonly templateDialogOpen = signal(false);
  readonly quickAdvancedOpen = signal(false);
  readonly customAdvancedOpen = signal(false);
  readonly preview = signal<TenantReportPreview | null>(null);
  readonly lastPreviewRequest = signal<TenantReportPreviewRequest | null>(null);
  readonly isLoading = signal(false);
  readonly isPreviewLoading = signal(false);
  readonly isExportingPdf = signal(false);
  readonly isSavingReport = signal(false);
  readonly dataError = signal<string | null>(null);
  readonly savedSearch = signal('');
  readonly savedCategoryFilter = signal<'all' | TenantReportSource>('all');
  readonly savedSort = signal<SavedSort>('recent');
  readonly ownerName = this.identity.username() ?? 'Tenant Admin';
  readonly filterOperators = FILTER_OPERATORS;
  readonly customReport = signal<CustomReportForm>({
    name: 'New Report',
    source: '',
    columns: [],
    filters: [],
    sorting: { field: '', direction: 'asc' },
    dateRange: 'this-month',
  });

  readonly activeCategory = computed(() => this.categories().find((category) => category.id === this.activeCategoryId()) ?? this.categories()[0]);
  readonly categoryTemplates = computed(() => this.templates().filter((template) => template.categoryId === this.activeCategoryId()));
  readonly selectedTemplateColumns = computed(() => this.selectedTemplate()?.columns ?? []);
  readonly currentPreviewTitle = computed(() => this.preview()?.title ?? 'Report Preview');
  readonly sourceTemplates = computed(() => this.templates().filter((template) => template.categoryId === this.customReport().source));
  readonly availableColumns = computed(() => this.sourceTemplates()[0]?.columns ?? []);
  readonly showColumns = computed(() => Boolean(this.customReport().source));
  readonly showFilters = computed(() => this.customReport().columns.length > 0);
  readonly showSorting = computed(() => this.customReport().filters.length > 0);
  readonly previewMetrics = computed(() => this.preview()?.summaryCards ?? []);
  readonly previewColumns = computed(() => this.preview()?.columns ?? []);
  readonly previewRows = computed(() => this.preview()?.rows ?? []);
  readonly filteredSavedReports = computed(() => {
    const search = this.savedSearch().trim().toLowerCase();
    const category = this.savedCategoryFilter();
    const reports = this.savedReports()
      .filter((report) => category === 'all' || report.module === category || report.dataSource === category)
      .filter((report) => !search || report.name.toLowerCase().includes(search));

    return [...reports].sort((first, second) => {
      switch (this.savedSort()) {
        case 'alphabetical':
          return first.name.localeCompare(second.name);
        case 'most-used':
          return second.usageCount - first.usageCount;
        case 'favorites':
          return Number(second.favorite) - Number(first.favorite) || first.name.localeCompare(second.name);
        case 'recent':
        default:
          return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      }
    });
  });

  constructor() {
    effect((onCleanup) => {
      const request = this.customPreviewRequest();
      if (!request) {
        return;
      }
      if (this.skipNextCustomPreview) {
        this.skipNextCustomPreview = false;
        return;
      }

      const timeout = window.setTimeout(() => this.previewReport(request), 400);
      onCleanup(() => window.clearTimeout(timeout));
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  selectCategory(categoryId: TenantReportSource): void {
    this.activeCategoryId.set(categoryId);
  }

  openTemplate(template: TenantReportTemplate): void {
    this.selectedTemplate.set(cloneTemplate(template));
    this.templateFilters.set(template.filters.filter((filter) => filter.selected).map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    })));
    this.quickAdvancedOpen.set(false);
    this.templateDialogOpen.set(true);
  }

  closeTemplateDialog(): void {
    this.templateDialogOpen.set(false);
  }

  toggleTemplateColumn(columnId: string): void {
    this.selectedTemplate.update((template) => {
      if (!template) {
        return template;
      }

      return {
        ...template,
        columns: template.columns.map((column) => column.id === columnId ? { ...column, selected: !column.selected } : column),
      };
    });
  }

  updateTemplateDateRange(dateRange: TenantReportDateRange): void {
    this.selectedTemplate.update((template) => template ? { ...template, defaultDateRange: dateRange } : template);
  }

  addTemplateFilter(): void {
    this.templateFilters.update((filters) => [...filters, this.emptyFilter(this.selectedTemplateColumns()[0]?.id)]);
  }

  updateTemplateFilter(index: number, patch: Partial<TenantReportFilter>): void {
    this.templateFilters.update((filters) => filters.map((filter, filterIndex) => filterIndex === index ? { ...filter, ...patch } : filter));
  }

  removeTemplateFilter(index: number): void {
    this.templateFilters.update((filters) => filters.filter((_, filterIndex) => filterIndex !== index));
  }

  generateFromTemplate(): void {
    const template = this.selectedTemplate();
    if (!template) {
      return;
    }

    const columns = template.columns.filter((column) => column.selected).map((column) => column.id);
    if (columns.length === 0) {
      this.dataError.set('Select at least one column.');
      return;
    }

    this.previewReport({
      name: template.name,
      dataSource: template.categoryId,
      columns,
      filters: this.templateFilters(),
      sorting: { field: columns[0], direction: 'asc' },
      dateRange: template.defaultDateRange,
      page: 0,
      size: 25,
    });
    this.templateDialogOpen.set(false);
  }

  startCustomReport(): void {
    if (!this.customReport().source) {
      this.updateCustomSource('students');
    }
  }

  updateCustomSource(source: CustomReportSource): void {
    const template = this.templates().find((item) => item.categoryId === source);
    this.customReport.update((report) => ({
      ...report,
      source,
      columns: [],
      filters: [],
      sorting: { field: template?.columns[0]?.id ?? '', direction: 'asc' },
    }));
    this.preview.set(null);
  }

  updateCustomName(name: string): void {
    this.customReport.update((report) => ({ ...report, name }));
  }

  updateCustomSorting(field: string): void {
    this.customReport.update((report) => ({ ...report, sorting: { ...report.sorting, field } }));
  }

  updateCustomSortingDirection(direction: 'asc' | 'desc'): void {
    this.customReport.update((report) => ({ ...report, sorting: { ...report.sorting, direction } }));
  }

  updateCustomDateRange(dateRange: TenantReportDateRange): void {
    this.customReport.update((report) => ({ ...report, dateRange }));
  }

  toggleCustomColumn(column: string): void {
    this.customReport.update((report) => {
      const columns = report.columns.includes(column)
        ? report.columns.filter((item) => item !== column)
        : [...report.columns, column];
      return {
        ...report,
        columns,
        filters: columns.length === 0 ? [] : report.filters,
        sorting: columns.includes(report.sorting.field) ? report.sorting : { field: columns[0] ?? '', direction: 'asc' },
      };
    });
  }

  addCustomFilter(): void {
    this.customReport.update((report) => ({
      ...report,
      filters: [...report.filters, this.emptyFilter(report.columns[0])],
    }));
  }

  updateCustomFilter(index: number, patch: Partial<TenantReportFilter>): void {
    this.customReport.update((report) => ({
      ...report,
      filters: report.filters.map((filter, filterIndex) => filterIndex === index ? { ...filter, ...patch } : filter),
    }));
  }

  removeCustomFilter(index: number): void {
    this.customReport.update((report) => ({
      ...report,
      filters: report.filters.filter((_, filterIndex) => filterIndex !== index),
    }));
  }

  saveReport(): void {
    const request = this.lastPreviewRequest();
    if (!request) {
      this.dataError.set('Generate a report preview before saving.');
      return;
    }

    this.isSavingReport.set(true);
    this.dataError.set(null);
    this.reportsData.saveReport({
      name: request.name,
      module: request.dataSource,
      dataSource: request.dataSource,
      columns: request.columns,
      filters: request.filters,
      sorting: request.sorting,
      dateRange: request.dateRange,
      advancedOptions: request.advancedOptions,
    }).subscribe({
      next: (report) => {
        this.savedReports.update((reports) => [report, ...reports.filter((item) => item.id !== report.id)]);
        this.isSavingReport.set(false);
      },
      error: (error: Error) => {
        this.dataError.set(error.message);
        this.isSavingReport.set(false);
      },
    });
  }

  openSavedReport(report: TenantSavedReport): void {
    const columns = this.savedReportColumns(report);
    if (columns.length === 0) {
      this.dataError.set('This saved report has no columns to preview.');
      return;
    }

    const sorting = report.sorting?.field
      ? report.sorting
      : { field: columns[0], direction: 'asc' as const };
    const filters = report.filters ?? [];
    const request: TenantReportPreviewRequest = {
      name: report.name,
      dataSource: report.dataSource,
      columns,
      filters,
      sorting,
      dateRange: report.dateRange,
      advancedOptions: report.advancedOptions,
      page: 0,
      size: 25,
    };

    this.skipNextCustomPreview = true;
    this.customReport.set({
      name: report.name,
      source: report.dataSource,
      columns,
      filters,
      sorting,
      dateRange: report.dateRange,
    });
    this.activeCategoryId.set(report.dataSource);
    this.previewReport(request);
  }

  exportPreview(): void {
    const request = this.lastPreviewRequest();
    if (!request || !this.preview()) {
      this.dataError.set('Generate a report preview before exporting PDF.');
      return;
    }

    this.isExportingPdf.set(true);
    this.dataError.set(null);
    this.reportsData.exportPreviewPdf(request).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.fileSafeName(request.name || 'report-preview')}.pdf`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        this.isExportingPdf.set(false);
      },
      error: (error: Error) => {
        this.dataError.set(error.message);
        this.isExportingPdf.set(false);
      },
    });
  }

  toggleSavedFavorite(reportId: string): void {
    this.reportsData.toggleFavorite(reportId).subscribe({
      next: (updated) => this.savedReports.update((reports) => reports.map((report) => report.id === reportId ? updated : report)),
      error: (error: Error) => this.dataError.set(error.message),
    });
  }

  duplicateSavedReport(reportId: string): void {
    this.reportsData.duplicateReport(reportId).subscribe({
      next: (report) => this.savedReports.update((reports) => [report, ...reports]),
      error: (error: Error) => this.dataError.set(error.message),
    });
  }

  deleteSavedReport(reportId: string): void {
    this.reportsData.deleteReport(reportId).subscribe({
      next: () => this.savedReports.update((reports) => reports.filter((report) => report.id !== reportId)),
      error: (error: Error) => this.dataError.set(error.message),
    });
  }

  setSavedSearch(value: string): void {
    this.savedSearch.set(value);
  }

  setSavedCategoryFilter(value: 'all' | TenantReportSource): void {
    this.savedCategoryFilter.set(value);
  }

  setSavedSort(value: SavedSort): void {
    this.savedSort.set(value);
  }

  shouldShowFilterValue(operator: TenantReportFilterOperator): boolean {
    return FILTER_OPERATORS.find((item) => item.value === operator)?.requiresValue ?? true;
  }

  shouldShowSecondFilterValue(operator: TenantReportFilterOperator): boolean {
    return FILTER_OPERATORS.find((item) => item.value === operator)?.requiresSecondValue ?? false;
  }

  valueFor(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    return value == null ? '' : String(value);
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.dataError.set(null);

    forkJoin({
      templates: this.reportsData.loadTemplates(),
      savedReports: this.reportsData.loadSavedReports(),
    }).subscribe({
      next: ({ templates, savedReports }) => {
        this.templates.set(templates ?? []);
        this.savedReports.set(savedReports ?? []);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.dataError.set(error.message || 'Report data could not be loaded right now.');
        this.isLoading.set(false);
      },
    });
  }

  private customPreviewRequest(): TenantReportPreviewRequest | null {
    const report = this.customReport();
    if (!report.source || report.columns.length === 0) {
      return null;
    }

    return {
      name: report.name || 'Custom Report',
      dataSource: report.source,
      columns: report.columns,
      filters: report.filters,
      sorting: report.sorting.field ? report.sorting : { field: report.columns[0], direction: 'asc' },
      dateRange: report.dateRange,
      page: 0,
      size: 25,
    };
  }

  private previewReport(request: TenantReportPreviewRequest): void {
    this.isPreviewLoading.set(true);
    this.dataError.set(null);
    this.lastPreviewRequest.set(request);
    this.reportsData.previewReport(request).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.isPreviewLoading.set(false);
      },
      error: (error: Error) => {
        this.dataError.set(error.message);
        this.isPreviewLoading.set(false);
      },
    });
  }

  private emptyFilter(field?: string): TenantReportFilter {
    return {
      field: field ?? '',
      operator: 'equals',
      value: '',
    };
  }

  private savedReportColumns(report: TenantSavedReport): string[] {
    if (report.columns?.length) {
      return report.columns;
    }

    return this.templates()
      .find((template) => template.categoryId === report.dataSource)
      ?.columns
      .filter((column) => column.selected)
      .map((column) => column.id) ?? [];
  }

  private fileSafeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report-preview';
  }
}

function cloneTemplate(template: TenantReportTemplate): TenantReportTemplate {
  return {
    ...template,
    columns: template.columns.map((column: TenantReportColumn) => ({ ...column })),
    filters: template.filters.map((filter) => ({ ...filter })),
  };
}
