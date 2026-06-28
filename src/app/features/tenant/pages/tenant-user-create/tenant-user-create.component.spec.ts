import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { TenantUserCreateFacade } from '../../state/tenant-user-create.facade';
import { TenantUserCreateComponent } from './tenant-user-create.component';

describe('TenantUserCreateComponent', () => {
  let fixture: ComponentFixture<TenantUserCreateComponent>;
  let facade: {
    roles: ReturnType<typeof signal<Array<{ id: string; label: string; icon: string; description: string }>>>;
    statuses: Array<{ id: string; label: string; color: string }>;
    userForm: ReturnType<FormBuilder['group']>;
    isSubmitting: boolean;
    isEditMode: boolean;
    initialize: ReturnType<typeof vi.fn>;
    onDestroy: ReturnType<typeof vi.fn>;
    resetForm: ReturnType<typeof vi.fn>;
    goBack: ReturnType<typeof vi.fn>;
    onSubmit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const fb = new FormBuilder();
    facade = {
      roles: signal([
        { id: 'role-1', label: 'Admin', icon: 'security', description: '15 permissions' },
      ]),
      statuses: [
        { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
        { id: 'Inactive', label: 'Inactive', color: 'bg-slate-400' },
      ],
      userForm: fb.group({
        fullName: [''],
        email: [''],
        username: ['', Validators.required],
        roleId: ['role-1', Validators.required],
        enabled: [true],
        sendInvite: [true],
        password: ['', [Validators.required, Validators.minLength(8)]],
      }),
      isSubmitting: false,
      isEditMode: false,
      initialize: vi.fn(),
      onDestroy: vi.fn(),
      resetForm: vi.fn(),
      goBack: vi.fn(),
      onSubmit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantUserCreateComponent],
      providers: [
        provideRouter([]),
        { provide: TenantUserCreateFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantUserCreateComponent);
    fixture.detectChanges();
  });

  it('initializes create state', () => {
    expect(facade.initialize).toHaveBeenCalledOnce();
  });

  it('renders username and password controls in create mode', () => {
    expect(fixture.nativeElement.querySelector('[formcontrolname="username"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[formcontrolname="password"]')).not.toBeNull();
  });

  it('shows field-specific credential validation messages', () => {
    facade.userForm.controls['username'].markAsTouched();
    facade.userForm.controls['password'].markAsTouched();
    facade.userForm.controls['username'].setErrors({ required: true });
    facade.userForm.controls['password'].setErrors({ minlength: true });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Username is required');
    expect(text).toContain('Password must be at least 8 characters');
  });
});
