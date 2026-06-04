import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { StudentDetails } from '../../models/tenant-students.models';
import { TenantStudentBarcodePrintComponent } from './tenant-student-barcode-print.component';

describe('TenantStudentBarcodePrintComponent', () => {
  let fixture: ComponentFixture<TenantStudentBarcodePrintComponent>;
  let dataService: { getStudent: ReturnType<typeof vi.fn> };

  const student: StudentDetails = {
    id: 'student-1',
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    grade: 'Basic Education',
    status: 'Active',
    enrollmentDate: 'Jun 2026',
    phone: '+201000000000',
    barcodeNumber: '000000000123',
    gender: 'Male',
    birthDate: 'Jan 10, 2008',
    parentName: 'Parent Ali',
    parentPhone: '+201000000001',
    address: 'Cairo',
    notifyParent: true,
    educationCategory: 'Basic Education',
    scheduleSummary: {
      attendanceLabel: '0%',
      attendanceProgress: 0,
      scheduleDaysCount: 0,
      totalGroups: 0,
      groupsCount: 0,
    },
    scheduleRows: [],
  };

  async function createComponent(options: {
    currentStudent?: StudentDetails;
    routeId?: string | null;
    error?: Error;
    pending?: boolean;
  } = {}): Promise<void> {
    TestBed.resetTestingModule();

    dataService = {
      getStudent: vi.fn().mockReturnValue(
        options.pending
          ? NEVER
          : options.error ? throwError(() => options.error) : of(options.currentStudent ?? student),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [TenantStudentBarcodePrintComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue(options.routeId === undefined ? 'student-1' : options.routeId),
              },
            },
          },
        },
        { provide: TenantStudentsDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantStudentBarcodePrintComponent);
    fixture.detectChanges();
  }

  function componentStyles(): string {
    const definition = (TenantStudentBarcodePrintComponent as unknown as { ɵcmp: { styles: string[] } }).ɵcmp;

    return definition.styles.join('\n');
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('loads a student and renders a single printable barcode card', async () => {
    await createComponent();

    expect(dataService.getStudent).toHaveBeenCalledWith('student-1');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="student-barcode-card"]').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ahmed Ali');
    expect(fixture.nativeElement.textContent).toContain('000000000123');
  });

  it('renders the barcode SVG for the stored student barcode value', async () => {
    await createComponent();

    const barcodeSvg = fixture.nativeElement.querySelector('[data-testid="student-barcode-print-shape"] svg');

    expect(barcodeSvg).not.toBeNull();
    expect(barcodeSvg?.getAttribute('data-student-barcode-value')).toBe(student.barcodeNumber);
  });

  it('keeps print and back controls outside the printable card', async () => {
    await createComponent();

    const card = fixture.nativeElement.querySelector('[data-testid="student-barcode-card"]');

    expect(card?.textContent).not.toContain('Print');
    expect(card?.textContent).not.toContain('Back');
    expect(fixture.nativeElement.querySelector('.print-toolbar button')?.textContent).toContain('Print');
    expect(fixture.nativeElement.querySelector('.print-toolbar a')?.textContent).toContain('Students');
  });

  it('defines print styles that isolate the barcode card as the only printed content', () => {
    const styles = componentStyles();

    expect(styles).toContain('@page');
    expect(styles).toContain('@media print');
    expect(styles).toContain('position: fixed');
    expect(styles).toContain('inset: 0');
    expect(styles).toMatch(/\.print-page[\s\S]*>\s*[\s\S]*:not\(\.barcode-card\)/);
    expect(styles).toContain('display: none !important');
    expect(styles).toContain('.barcode-card');
    expect(styles).toContain('width: 85.6mm !important');
    expect(styles).toContain('height: 53.98mm !important');
  });

  it('marks every non-card content state as hidden from print output', async () => {
    await createComponent();

    expect(fixture.nativeElement.querySelector('.print-toolbar')).not.toBeNull();

    await createComponent({ pending: true });

    expect(fixture.nativeElement.querySelector('.print-hidden')?.textContent).toContain('Loading barcode');

    await createComponent({ currentStudent: { ...student, barcodeNumber: '' } });

    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-unavailable"]')?.classList).toContain('print-hidden');

    await createComponent({ error: new Error('Student not found') });

    expect(fixture.nativeElement.querySelector('.print-hidden')?.textContent).toContain('Student not found');
  });

  it('calls browser print only when a printable barcode card exists', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    await createComponent();

    fixture.componentInstance.printBarcode();

    expect(printSpy).toHaveBeenCalledOnce();
  });

  it('shows unavailable state and no barcode SVG when barcode is missing', async () => {
    await createComponent({ currentStudent: { ...student, barcodeNumber: '' } });

    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-unavailable"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-print-shape"] svg')).toBeNull();
  });

  it('shows unavailable state and no barcode SVG when barcode is invalid', async () => {
    await createComponent({ currentStudent: { ...student, barcodeNumber: 'invalid-value' } });

    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-unavailable"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-print-shape"] svg')).toBeNull();
  });

  it('shows loading state and no printable barcode card while student data is pending', async () => {
    await createComponent({ pending: true });

    expect(fixture.nativeElement.textContent).toContain('Loading barcode');
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-card"]')).toBeNull();
  });

  it('does not call browser print when no printable card exists', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    await createComponent({ currentStudent: { ...student, barcodeNumber: '' } });

    fixture.componentInstance.printBarcode();

    expect(printSpy).not.toHaveBeenCalled();
  });

  it('shows student not found when route id is missing', async () => {
    await createComponent({ routeId: null });

    expect(dataService.getStudent).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Student not found');
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-card"]')).toBeNull();
  });

  it('shows service error when student cannot be loaded', async () => {
    await createComponent({ error: new Error('Student not found') });

    expect(fixture.nativeElement.textContent).toContain('Student not found');
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-card"]')).toBeNull();
  });
});
