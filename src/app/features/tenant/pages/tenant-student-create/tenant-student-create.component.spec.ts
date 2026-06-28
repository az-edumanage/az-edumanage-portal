import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { TenantStudentCreateFacade } from '../../state/tenant-student-create.facade';
import { TenantStudentCreateComponent } from './tenant-student-create.component';

describe('TenantStudentCreateComponent', () => {
  let fixture: ComponentFixture<TenantStudentCreateComponent>;
  let facade: {
    isSubmitting: ReturnType<typeof signal<boolean>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    studentForm: ReturnType<FormBuilder['group']>;
    stages: ReturnType<typeof signal<never[]>>;
    universities: ReturnType<typeof signal<never[]>>;
    availableGrades: ReturnType<typeof signal<never[]>>;
    availableColleges: ReturnType<typeof signal<never[]>>;
    initialize: ReturnType<typeof vi.fn>;
    onDestroy: ReturnType<typeof vi.fn>;
    resetForm: ReturnType<typeof vi.fn>;
    cancelDraft: ReturnType<typeof vi.fn>;
    onSubmit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const fb = new FormBuilder();
    facade = {
      isSubmitting: signal(false),
      isLoading: signal(false),
      errorMessage: signal(null),
      studentForm: fb.group({
        fullName: [''],
        email: [''],
        phone: [''],
        username: [''],
        password: [''],
        birthDate: [''],
        gender: ['Male'],
        parentName: [''],
        parentPhone: [''],
        address: [''],
        notifyParent: [true],
        educationCategory: ['BASIC_EDUCATION'],
        stageIds: [[] as string[]],
        gradeIds: [[] as string[]],
        universityIds: [[] as string[]],
        collegeIds: [[] as string[]],
      }),
      stages: signal([]),
      universities: signal([]),
      availableGrades: signal([]),
      availableColleges: signal([]),
      initialize: vi.fn(),
      onDestroy: vi.fn(),
      resetForm: vi.fn(),
      cancelDraft: vi.fn(),
      onSubmit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantStudentCreateComponent],
      providers: [
        provideRouter([]),
        { provide: TenantStudentCreateFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantStudentCreateComponent);
    fixture.detectChanges();
  });

  it('initializes create state', () => {
    expect(facade.initialize).toHaveBeenCalledOnce();
  });

  it('does not render barcode field, preview, or label text', () => {
    const text = fixture.nativeElement.textContent.toLowerCase();

    expect(text).not.toContain('barcode');
    expect(fixture.nativeElement.querySelector('[formcontrolname="barcodeNumber"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="student-barcode-shape"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg[data-student-barcode-value]')).toBeNull();
  });

  it('renders account access controls for student login', () => {
    expect(fixture.nativeElement.querySelector('[formcontrolname="username"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="password"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Account Access');
  });

  it('renders save errors from the facade', () => {
    facade.errorMessage.set('User name already exists');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('User name already exists');
  });
});
