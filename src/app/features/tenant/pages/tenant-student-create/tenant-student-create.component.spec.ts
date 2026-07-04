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
    isEditMode: ReturnType<typeof signal<boolean>>;
    studentForm: ReturnType<FormBuilder['group']>;
    stages: ReturnType<typeof signal<never[]>>;
    universities: ReturnType<typeof signal<never[]>>;
    availableGrades: ReturnType<typeof signal<never[]>>;
    availableColleges: ReturnType<typeof signal<never[]>>;
    parentsLoading: ReturnType<typeof signal<boolean>>;
    filteredParents: ReturnType<typeof signal<{ id: string; appUserId: string; name: string; phone: string; notifyParent: boolean; students: never[] }[]>>;
    parentSearchQuery: ReturnType<typeof signal<string>>;
    addParentModalOpen: ReturnType<typeof signal<boolean>>;
    addParentSaving: ReturnType<typeof signal<boolean>>;
    addParentError: ReturnType<typeof signal<string | null>>;
    addParentForm: ReturnType<FormBuilder['group']>;
    selectedParent: ReturnType<typeof vi.fn>;
    selectParent: ReturnType<typeof vi.fn>;
    openAddParentModal: ReturnType<typeof vi.fn>;
    closeAddParentModal: ReturnType<typeof vi.fn>;
    submitAddParent: ReturnType<typeof vi.fn>;
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
      isEditMode: signal(false),
      studentForm: fb.group({
        fullName: [''],
        email: [''],
        phone: [''],
        username: [''],
        password: [''],
        birthDate: [''],
        gender: ['Male'],
        parentAppUserId: [''],
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
      parentsLoading: signal(false),
      filteredParents: signal([
        { id: 'parent-user-1', appUserId: 'parent-user-1', name: 'Parent Ali', phone: '+201000000001', notifyParent: true, students: [] },
      ]),
      parentSearchQuery: signal(''),
      addParentModalOpen: signal(false),
      addParentSaving: signal(false),
      addParentError: signal(null),
      addParentForm: fb.group({
        fullName: [''],
        phone: [''],
        email: [''],
        username: [''],
        password: [''],
      }),
      selectedParent: vi.fn(() => null),
      selectParent: vi.fn(),
      openAddParentModal: vi.fn(),
      closeAddParentModal: vi.fn(),
      submitAddParent: vi.fn(),
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

  it('renders account access controls for student login and parent selector', () => {
    expect(fixture.nativeElement.querySelector('[formcontrolname="username"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="password"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="parentUsername"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="parentPassword"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="address"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Select parent or guardian');
    expect(fixture.nativeElement.textContent).toContain('Account Access');
  });

  it('opens add parent modal from the parent selector', () => {
    fixture.componentInstance.toggleParentPanel();
    fixture.detectChanges();

    const addButton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Add Parent')) as HTMLButtonElement;
    addButton.click();

    expect(facade.openAddParentModal).toHaveBeenCalledOnce();
  });

  it('opens reset confirmation modal before clearing the form', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    const resetButton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.trim() === 'Reset') as HTMLButtonElement;

    resetButton.click();
    fixture.detectChanges();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(facade.resetForm).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Reset student form?');

    const resetFormButton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Reset form')) as HTMLButtonElement;
    resetFormButton.click();

    expect(facade.resetForm).toHaveBeenCalledOnce();
  });

  it('renders save errors from the facade', () => {
    facade.errorMessage.set('User name already exists');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('User name already exists');
  });
});
