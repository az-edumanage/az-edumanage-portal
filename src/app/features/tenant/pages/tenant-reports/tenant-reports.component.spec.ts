import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import { TenantReportsDataService } from '../../data-access/tenant-reports-data.service';
import { TenantReportPreview, TenantReportTemplate, TenantSavedReport } from '../../models/tenant-reports.models';
import { TenantReportsComponent } from './tenant-reports.component';

describe('TenantReportsComponent', () => {
  let fixture: ComponentFixture<TenantReportsComponent>;
  let reportsData: {
    loadTemplates: ReturnType<typeof vi.fn>;
    loadSavedReports: ReturnType<typeof vi.fn>;
    previewReport: ReturnType<typeof vi.fn>;
    exportPreviewPdf: ReturnType<typeof vi.fn>;
    saveReport: ReturnType<typeof vi.fn>;
    toggleFavorite: ReturnType<typeof vi.fn>;
    duplicateReport: ReturnType<typeof vi.fn>;
    deleteReport: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const identity = {
      username: () => 'aya',
    };
    reportsData = {
      loadTemplates: vi.fn(() => of(reportTemplates())),
      loadSavedReports: vi.fn(() => of(savedReports())),
      previewReport: vi.fn(() => of(reportPreview())),
      exportPreviewPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
      saveReport: vi.fn(() => of(savedReports()[0])),
      toggleFavorite: vi.fn(() => of({ ...savedReports()[0], favorite: false })),
      duplicateReport: vi.fn(() => of({ ...savedReports()[0], id: 'saved-copy', name: 'Active Student List Copy' })),
      deleteReport: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [TenantReportsComponent],
      providers: [
        { provide: AuthIdentityService, useValue: identity },
        { provide: TenantReportsDataService, useValue: reportsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantReportsComponent);
    fixture.detectChanges();
  });

  it('keeps the approved report sections and no BI or AI workspace language', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Reports');
    expect(text).toContain('Quick Reports');
    expect(text).toContain('Students');
    expect(text).toContain('Attendance');
    expect(text).toContain('Custom Report');
    expect(text).toContain('Report Preview');
    expect(text).toContain('Saved Reports');
    expect(text).not.toContain('AI');
    expect(text).not.toContain('Copilot');
    expect(text).not.toContain('Canvas');
    expect(text).not.toContain('Inspector');
    expect(text).not.toContain('Query');
    expect(text).not.toContain('Report Health');
  });

  it('opens a lightweight template dialog with checkboxes and generates a preview', () => {
    const studentTemplateButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => (button.nativeElement.textContent as string).includes('Create Report'));

    studentTemplateButton?.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Columns');
    expect(fixture.nativeElement.textContent).toContain('Filters');
    expect(fixture.nativeElement.textContent).toContain('Date Range');
    expect(fixture.nativeElement.textContent).toContain('Advanced Options');
    expect(fixture.debugElement.queryAll(By.css('.template-dialog input[type="checkbox"]')).length).toBeGreaterThan(0);

    const generateButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => (button.nativeElement.textContent as string).includes('Generate Report'));

    generateButton?.nativeElement.click();
    fixture.detectChanges();

    expect(reportsData.previewReport).toHaveBeenCalled();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Student List');
    expect(text).toContain('Optional Chart');
    expect(text).toContain('Save Report');
    expect(text).toContain('Students Found');
    expect(text).toContain('Outstanding Balance');
  });

  it('progressively reveals custom report controls and live previews changes', async () => {
    const component = fixture.componentInstance;

    expect(component.showColumns()).toBe(false);
    component.updateCustomSource('students');
    fixture.detectChanges();
    expect(component.showColumns()).toBe(true);
    expect(component.showFilters()).toBe(false);

    component.toggleCustomColumn('studentName');
    fixture.detectChanges();
    expect(component.showFilters()).toBe(true);

    component.addCustomFilter();
    fixture.detectChanges();
    expect(component.showSorting()).toBe(true);

    await new Promise((resolve) => window.setTimeout(resolve, 450));
    fixture.detectChanges();

    expect(reportsData.previewReport).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Student List');
  });

  it('adds saved report search, category filter, and sort controls without changing cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Search');
    expect(text).toContain('Category');
    expect(text).toContain('Sort By');
    expect(text).toContain('Recently Modified');
    expect(text).toContain('Active Student List');
    expect(text).toContain('Duplicate');
    expect(text).toContain('Delete');
  });

  it('opens a saved report into the existing preview area', () => {
    const openButton = fixture.debugElement
      .queryAll(By.css('.saved-actions button'))
      .find((button) => (button.nativeElement.textContent as string).includes('Open'));

    openButton?.nativeElement.click();
    fixture.detectChanges();

    expect(reportsData.previewReport).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Active Student List',
      dataSource: 'students',
      columns: ['studentName', 'phone'],
      dateRange: 'this-month',
    }));
    expect(fixture.nativeElement.textContent).toContain('Student List');
  });

  it('exports the current preview as a PDF file', () => {
    fixture.componentInstance.preview.set(reportPreview());
    fixture.componentInstance.lastPreviewRequest.set({
      name: 'Student List',
      dataSource: 'students',
      columns: ['studentName', 'phone'],
      filters: [],
      sorting: { field: 'studentName', direction: 'asc' },
      dateRange: 'this-month',
      page: 0,
      size: 25,
    });
    fixture.detectChanges();

    const exportButton = fixture.debugElement
      .queryAll(By.css('.preview-actions button'))
      .find((button) => (button.nativeElement.textContent as string).includes('Export PDF'));
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report-preview');
    const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.fn();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement);

    exportButton?.nativeElement.click();

    expect(reportsData.exportPreviewPdf).toHaveBeenCalled();
    expect(createElement).toHaveBeenCalledWith('a');
    expect(windowOpen).toHaveBeenCalledWith('blob:report-preview', '_blank', 'noopener');
    expect(createObjectUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();

    createObjectUrl.mockRestore();
    windowOpen.mockRestore();
    revokeObjectUrl.mockRestore();
    createElement.mockRestore();
  });
});

function reportTemplates(): TenantReportTemplate[] {
  return [
    {
      id: 'student-list',
      categoryId: 'students',
      name: 'Student List',
      description: 'A clean student directory.',
      icon: 'list_alt',
      defaultDateRange: 'this-month',
      columns: [
        { id: 'studentName', label: 'Student Name', selected: true },
        { id: 'phone', label: 'Phone', selected: true },
        { id: 'group', label: 'Group', selected: true },
        { id: 'status', label: 'Status', selected: true },
      ],
      filters: [
        { id: 'active-students', label: 'Active Students', selected: false, field: 'status', operator: 'equals', value: 'Active' },
      ],
    },
    {
      id: 'invoice-list',
      categoryId: 'billing',
      name: 'Invoices',
      description: 'Invoice list.',
      icon: 'receipt',
      defaultDateRange: 'this-month',
      columns: [
        { id: 'invoice', label: 'Invoice', selected: true },
        { id: 'amount', label: 'Amount', selected: true },
      ],
      filters: [],
    },
  ];
}

function savedReports(): TenantSavedReport[] {
  return [
    {
      id: 'saved-students',
      name: 'Active Student List',
      module: 'students',
      dataSource: 'students',
      dateRange: 'this-month',
      favorite: true,
      icon: 'school',
      createdBy: 'Aya',
      createdAt: '2026-06-30T10:00:00.000Z',
      updatedAt: '2026-06-30T10:42:00.000Z',
      usageCount: 12,
      columns: ['studentName', 'phone'],
      filters: [{ field: 'status', operator: 'equals', value: 'Active' }],
      sorting: { field: 'studentName', direction: 'asc' },
      advancedOptions: {},
    },
  ];
}

function reportPreview(): TenantReportPreview {
  return {
    title: 'Student List',
    dataSource: 'students',
    columns: ['Student Name', 'Phone', 'Group', 'Status'],
    summaryCards: [
      { label: 'Students Found', value: '1' },
      { label: 'Outstanding Balance', value: 'EGP 500', tone: 'warning' },
    ],
    chart: { labels: ['Students'], series: ['Students'], values: [1] },
    rows: [{ 'Student Name': 'Hussein Mohamed', Phone: '0100', Group: 'Science G5', Status: 'Active' }],
    page: 0,
    size: 25,
    totalItems: 1,
    empty: false,
  };
}
