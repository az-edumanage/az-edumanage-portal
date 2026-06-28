import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TenantGradeCreateDataService } from '../data-access/tenant-grade-create-data.service';
import { TenantGradeCreateFacade } from './tenant-grade-create.facade';
import { TenantGradeCreateStore } from './tenant-grade-create.store';

describe('TenantGradeCreateStore', () => {
  it('tracks submit state', () => {
    const store = new TenantGradeCreateStore();

    expect(store.isSubmitting()).toBeFalsy();
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBeTruthy();
  });
});

describe('TenantGradeCreateFacade', () => {
  let facade: TenantGradeCreateFacade;
  let dataService: {
    listCountryOptions: ReturnType<typeof vi.fn>;
    createCountryOption: ReturnType<typeof vi.fn>;
    listAcademicLevelOptions: ReturnType<typeof vi.fn>;
    getGrade: ReturnType<typeof vi.fn>;
    createGrade: ReturnType<typeof vi.fn>;
    updateGrade: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
    toCountryUserMessage: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let taskService: {
    getTask: ReturnType<typeof vi.fn>;
    removeTask: ReturnType<typeof vi.fn>;
    addTask: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listCountryOptions: vi.fn().mockResolvedValue([
        { value: 'country-eg', label: 'Egypt', code: 'EG' },
        { value: 'country-jo', label: 'Jordan', code: 'JO' },
      ]),
      createCountryOption: vi.fn().mockResolvedValue({ value: 'country-ma', label: 'Morocco', code: null }),
      listAcademicLevelOptions: vi.fn().mockImplementation((countryId: string) =>
        Promise.resolve(countryId === 'country-eg'
          ? [{ value: 'stage-secondary', label: 'Secondary', countryId: 'country-eg' }]
          : countryId === 'country-jo'
            ? [{ value: 'stage-primary', label: 'Primary', countryId: 'country-jo' }]
            : [{ value: 'stage-diploma', label: 'Diploma', countryId: 'country-ma' }]),
      ),
      getGrade: vi.fn().mockResolvedValue({
        id: 'grade-1',
        name: 'Grade 10',
        description: 'First secondary grade',
        level: 'Secondary',
        stageId: 'stage-secondary',
        countryId: 'country-eg',
        country: 'Egypt',
        countryCode: 'EG',
        studentCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        groups: [],
      }),
      createGrade: vi.fn().mockResolvedValue({ id: 'grade-1' }),
      updateGrade: vi.fn().mockResolvedValue({ id: 'grade-1' }),
      toUserMessage: vi.fn().mockReturnValue('Backend validation failed'),
      toCountryUserMessage: vi.fn().mockReturnValue('Country validation failed'),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    taskService = {
      getTask: vi.fn().mockReturnValue(null),
      removeTask: vi.fn(),
      addTask: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantGradeCreateDataService, useValue: dataService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: { back: vi.fn() } },
        { provide: TaskService, useValue: taskService },
      ],
    });
    facade = TestBed.inject(TenantGradeCreateFacade);
  });

  it('loads countries and academic levels on initialize', async () => {
    await facade.initialize();

    expect(facade.countryOptions()).toHaveLength(2);
    expect(facade.academicLevelOptions()).toEqual([
      { value: 'stage-secondary', label: 'Secondary', countryId: 'country-eg' },
    ]);
    expect(facade.gradeForm.controls.countryId.value).toBe('country-eg');
    expect(facade.gradeForm.controls.stageId.value).toBe('stage-secondary');
  });

  it('starts with empty create fields when fresh create is requested', async () => {
    taskService.getTask.mockReturnValueOnce({
      data: {
        name: 'Draft Grade',
        countryId: 'country-eg',
        stageId: 'stage-secondary',
        description: 'Draft description',
      },
    });

    await facade.initialize(null, null, true);

    expect(taskService.removeTask).toHaveBeenCalledWith('create-grade-task');
    expect(taskService.getTask).not.toHaveBeenCalled();
    expect(facade.gradeForm.getRawValue()).toEqual({
      name: '',
      countryId: '',
      stageId: '',
      description: '',
    });
    expect(facade.academicLevelOptions()).toEqual([]);
  });

  it('initializes edit mode with existing grade values and filtered levels', async () => {
    await facade.initialize('grade-1');

    expect(facade.isEditMode()).toBeTruthy();
    expect(dataService.getGrade).toHaveBeenCalledWith('grade-1');
    expect(dataService.listAcademicLevelOptions).toHaveBeenLastCalledWith('country-eg');
    expect(facade.gradeForm.getRawValue()).toEqual({
      name: 'Grade 10',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: 'First secondary grade',
    });
  });

  it('clears stage selection and reloads levels when country changes', async () => {
    await facade.initialize();

    await facade.onCountryChange('country-jo');

    expect(dataService.listAcademicLevelOptions).toHaveBeenLastCalledWith('country-jo');
    expect(facade.academicLevelOptions()).toEqual([
      { value: 'stage-primary', label: 'Primary', countryId: 'country-jo' },
    ]);
    expect(facade.gradeForm.controls.stageId.value).toBe('stage-primary');
  });

  it('creates a country option and reloads academic levels for it', async () => {
    await facade.initialize();

    const countryId = await facade.createCountryOption('Morocco');

    expect(countryId).toBe('country-ma');
    expect(facade.countryOptions().map((country) => country.label)).toEqual(['Egypt', 'Jordan', 'Morocco']);
    expect(dataService.createCountryOption).toHaveBeenCalledWith('Morocco');
    expect(dataService.listAcademicLevelOptions).toHaveBeenLastCalledWith('country-ma');
    expect(facade.gradeForm.controls.countryId.value).toBe('country-ma');
    expect(facade.gradeForm.controls.stageId.value).toBe('stage-diploma');
  });

  it('submits a valid backend grade and navigates to the list', async () => {
    await facade.initialize();
    facade.gradeForm.patchValue({
      name: 'Grade 10',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: 'First secondary grade',
    });

    await facade.onSubmit();

    expect(dataService.createGrade).toHaveBeenCalledWith({
      name: 'Grade 10',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: 'First secondary grade',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/grades']);
  });

  it('updates an existing grade and navigates to the detail page', async () => {
    await facade.initialize('grade-1');
    facade.gradeForm.patchValue({
      name: 'Grade 11',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: 'Updated description',
    });

    await facade.onSubmit();

    expect(dataService.updateGrade).toHaveBeenCalledWith('grade-1', {
      name: 'Grade 11',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: 'Updated description',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/grades', 'grade-1']);
  });

  it('keeps edit form open and exposes load errors when grade loading fails', async () => {
    dataService.getGrade.mockRejectedValueOnce(new Error('Missing'));

    await facade.initialize('grade-1');

    expect(facade.loadError()).toBe('Backend validation failed');
    expect(facade.gradeForm.disabled).toBeTruthy();
  });

  it('keeps the form open and stores save errors on failed submit', async () => {
    dataService.createGrade.mockRejectedValueOnce(new Error('Duplicate'));
    await facade.initialize();
    facade.gradeForm.patchValue({
      name: 'Grade 10',
      countryId: 'country-eg',
      stageId: 'stage-secondary',
      description: '',
    });

    await facade.onSubmit();

    expect(facade.saveError()).toBe('Backend validation failed');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
