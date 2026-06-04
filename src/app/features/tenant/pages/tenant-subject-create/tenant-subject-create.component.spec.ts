import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { TenantSubjectCreateFacade } from '../../state/tenant-subject-create.facade';
import { TenantSubjectCreateComponent } from './tenant-subject-create.component';

describe('TenantSubjectCreateComponent', () => {
  let fixture: ComponentFixture<TenantSubjectCreateComponent>;
  const form = new FormBuilder().group({
    stageId: ['', Validators.required],
    gradeId: ['', Validators.required],
    name: ['', Validators.required],
  });
  const facade = {
    subjectForm: form,
    isSubmitting: signal(false),
    saveError: signal<string | null>(null),
    stages: signal([{ value: 'stage-1', label: 'Secondary' }]),
    filteredGrades: signal([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]),
    loading: signal(false),
    loadError: signal<string | null>(null),
    initialize: vi.fn().mockResolvedValue(undefined),
    onStageChange: vi.fn(),
    resetForm: vi.fn(),
    cancel: vi.fn().mockResolvedValue(undefined),
    submit: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectCreateComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectCreateFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectCreateComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders required subject create controls', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Create Subject');
    expect(text).toContain('Educational Stage');
    expect(text).toContain('Grade');
    expect(text).toContain('Subject name');
    expect(text).toContain('Save Subject');
  });

  it('initializes selector data on init', () => {
    expect(facade.initialize).toHaveBeenCalled();
  });
});
