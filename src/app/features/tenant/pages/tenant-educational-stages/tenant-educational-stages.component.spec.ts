import { signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantEducationalStagesFacade } from '../../state/tenant-educational-stages.facade';
import { TenantEducationalStagesComponent } from './tenant-educational-stages.component';

describe('TenantEducationalStagesComponent', () => {
  let fixture: ComponentFixture<TenantEducationalStagesComponent>;
  let facade: ReturnType<typeof createFacade>;

  beforeEach(async () => {
    facade = createFacade();
    await TestBed.configureTestingModule({
      imports: [TenantEducationalStagesComponent],
      providers: [
        { provide: TenantEducationalStagesFacade, useValue: facade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantEducationalStagesComponent);
    fixture.detectChanges();
  });

  it('loads stages and countries on init', () => {
    expect(facade.loadStages).toHaveBeenCalled();
    expect(facade.loadCountryOptions).toHaveBeenCalled();
  });

  it('opens edit modal with the selected row data', () => {
    const component = fixture.componentInstance;

    component.openEditModal(facade.stages()[0]);

    expect(component.editingStage()?.id).toBe('stage-primary');
    expect(component.createForm.getRawValue()).toEqual({
      name: 'Primary Stage',
      description: 'Description',
      countryId: 'country-eg',
    });
  });

  it('does not render grade or group creation controls', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Add Grade');
    expect(text).not.toContain('Add Class');
    expect(text).not.toContain('Add Group');
  });
});

function createFacade() {
  const searchQuery = signal('');
  const showFilterPanel = signal(false);
  const stages = signal([
    {
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
    },
  ]);

  return {
    searchQuery,
    showFilterPanel,
    stages,
    activeFiltersCount: computed(() => 0),
    filteredStages: computed(() => stages()),
    countryOptions: signal([{ value: 'country-eg', label: 'Egypt', code: null }]),
    loading: signal(false),
    countriesLoading: signal(false),
    saving: signal(false),
    deletingStageId: signal<string | null>(null),
    loadError: signal<string | null>(null),
    countriesError: signal<string | null>(null),
    saveError: signal<string | null>(null),
    deleteError: signal<string | null>(null),
    setFilters: vi.fn(),
    clearAdvancedFilters: vi.fn(),
    clearAllFilters: vi.fn(),
    loadStages: vi.fn().mockResolvedValue(undefined),
    loadCountryOptions: vi.fn().mockResolvedValue(undefined),
    createStage: vi.fn().mockResolvedValue(true),
    updateStage: vi.fn().mockResolvedValue(true),
    deleteStage: vi.fn().mockResolvedValue(true),
    toggleFilterPanel: vi.fn(),
  };
}
