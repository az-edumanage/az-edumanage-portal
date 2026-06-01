import { TestBed } from '@angular/core/testing';
import { EducationalStage } from '../models/tenant-educational-stages.models';
import { TenantEducationalStagesDataService } from '../data-access/tenant-educational-stages-data.service';
import { TenantEducationalStagesStore } from './tenant-educational-stages.store';

describe('TenantEducationalStagesStore', () => {
  let store: TenantEducationalStagesStore;
  let dataService: {
    listStages: ReturnType<typeof vi.fn>;
    listCountryOptions: ReturnType<typeof vi.fn>;
    createStage: ReturnType<typeof vi.fn>;
    updateStage: ReturnType<typeof vi.fn>;
    deleteStage: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listStages: vi.fn().mockResolvedValue(sampleStages()),
      listCountryOptions: vi.fn().mockResolvedValue([
        { value: 'country-eg', label: 'Egypt', code: null },
        { value: 'country-sa', label: 'Saudi Arabia', code: null },
      ]),
      createStage: vi.fn().mockResolvedValue(stage({ id: 'stage-new', name: 'Advanced Diploma', countryId: 'country-sa', country: 'Saudi Arabia' })),
      updateStage: vi.fn().mockResolvedValue(stage({ id: 'stage-primary', name: 'Primary Updated', countryId: 'country-sa', country: 'Saudi Arabia' })),
      deleteStage: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Backend validation failed'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantEducationalStagesDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantEducationalStagesStore);
  });

  it('loads stages from backend data', async () => {
    await store.loadStages();

    expect(store.stages()).toEqual(sampleStages());
    expect(dataService.listStages).toHaveBeenCalled();
  });

  it('loads country options from backend countries', async () => {
    await store.loadCountryOptions();

    expect(store.countryOptions()).toEqual([
      { value: 'country-eg', label: 'Egypt', code: null },
      { value: 'country-sa', label: 'Saudi Arabia', code: null },
    ]);
  });

  it('filters stages by search query and country id', async () => {
    await store.loadStages();
    store.searchQuery.set('sec');
    store.countryFilter.set('country-eg');

    const filtered = store.filteredStages();

    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('SEC');
  });

  it('sorts stages by class count descending', async () => {
    await store.loadStages();
    store.sortBy.set('classes-desc');

    const filtered = store.filteredStages();

    expect(filtered[0].classCount).toBeGreaterThanOrEqual(filtered[1].classCount);
  });

  it('creates a new backend stage', async () => {
    const saved = await store.createStage({ name: 'Advanced Diploma', description: 'Real stage', countryId: 'country-sa' });

    const added = store.stages().find((stage) => stage.name === 'Advanced Diploma');

    expect(saved).toBe(true);
    expect(added).toBeTruthy();
    expect(added?.country).toBe('Saudi Arabia');
    expect(dataService.createStage).toHaveBeenCalledWith({ name: 'Advanced Diploma', description: 'Real stage', countryId: 'country-sa' });
  });

  it('keeps modal open signal path on save failure', async () => {
    dataService.createStage.mockRejectedValueOnce(new Error('Duplicate'));

    const saved = await store.createStage({ name: 'Primary', description: '', countryId: 'country-eg' });

    expect(saved).toBe(false);
    expect(store.saveError()).toBe('Backend validation failed');
  });

  it('updates an existing backend stage', async () => {
    await store.loadStages();
    await store.updateStage('stage-primary', { name: 'Primary Updated', description: 'Updated description', countryId: 'country-sa' });

    const updated = store.stages().find((stage) => stage.id === 'stage-primary');

    expect(updated?.name).toBe('Primary Updated');
    expect(updated?.countryId).toBe('country-sa');
  });

  it('deletes a backend stage', async () => {
    await store.loadStages();
    await store.deleteStage('stage-primary');

    expect(store.stages().some((stage) => stage.id === 'stage-primary')).toBe(false);
  });
});

function sampleStages() {
  return [
    stage({ id: 'stage-primary', name: 'Primary Stage', code: 'PRI', order: 1, countryId: 'country-eg', country: 'Egypt', gradeCount: 6, classCount: 18 }),
    stage({ id: 'stage-secondary', name: 'Secondary Stage', code: 'SEC', order: 2, countryId: 'country-eg', country: 'Egypt', gradeCount: 3, classCount: 10 }),
  ];
}

function stage(overrides: Partial<EducationalStage> = {}): EducationalStage {
  return {
    id: 'stage-primary',
    name: 'Primary Stage',
    code: 'PRI',
    order: 1,
    status: 'Active' as const,
    countryId: 'country-eg',
    country: 'Egypt',
    countryCode: null,
    gradeCount: 6,
    classCount: 18,
    description: 'Description',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
