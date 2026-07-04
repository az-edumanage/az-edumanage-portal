import { TestBed } from '@angular/core/testing';
import { TenantCountrySettingsService } from '../../data-access/tenant-country-settings.service';
import { TenantEquipmentFacilitySettingsService } from '../../data-access/tenant-equipment-facility-settings.service';
import { TenantQuestionSourceSettingsService } from '../../data-access/tenant-question-source-settings.service';
import { TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantRoomTypeSettingsService } from '../../data-access/tenant-room-type-settings.service';
import { TenantSubscriptionPeriodSettingsService } from '../../data-access/tenant-subscription-period-settings.service';
import { TenantPlatformSettingsComponent } from './tenant-platform-settings.component';

describe('TenantPlatformSettingsComponent', () => {
  let countrySettings: {
    listCountries: ReturnType<typeof vi.fn>;
    createCountry: ReturnType<typeof vi.fn>;
    updateCountry: ReturnType<typeof vi.fn>;
    deleteCountry: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let roomTypeSettings: {
    listRoomTypes: ReturnType<typeof vi.fn>;
    createRoomType: ReturnType<typeof vi.fn>;
    updateRoomType: ReturnType<typeof vi.fn>;
    deleteRoomType: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let subscriptionPeriodSettings: {
    listSubscriptionPeriods: ReturnType<typeof vi.fn>;
    createSubscriptionPeriod: ReturnType<typeof vi.fn>;
    updateSubscriptionPeriod: ReturnType<typeof vi.fn>;
    deleteSubscriptionPeriod: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let equipmentFacilitySettings: {
    listEquipmentFacilities: ReturnType<typeof vi.fn>;
    createEquipmentFacility: ReturnType<typeof vi.fn>;
    updateEquipmentFacility: ReturnType<typeof vi.fn>;
    deleteEquipmentFacility: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let questionTypeSettings: {
    listQuestionTypes: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let questionSourceSettings: {
    listQuestionSources: ReturnType<typeof vi.fn>;
    createQuestionSource: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    countrySettings = {
      listCountries: vi.fn().mockResolvedValue([
        { id: 'country-1', name: 'Brazil', code: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      ]),
      createCountry: vi.fn().mockResolvedValue({
        id: 'country-2',
        name: 'Morocco',
        code: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      updateCountry: vi.fn().mockResolvedValue({
        id: 'country-1',
        name: 'Jordan',
        code: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      deleteCountry: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Country name already exists'),
    };
    roomTypeSettings = {
      listRoomTypes: vi.fn().mockResolvedValue([
        {
          id: 'room-type-1',
          name: 'Classroom',
          description: 'Standard teaching room',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]),
      createRoomType: vi.fn().mockResolvedValue({
        id: 'room-type-2',
        name: 'Laboratory',
        description: 'Science room',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      updateRoomType: vi.fn().mockResolvedValue({
        id: 'room-type-1',
        name: 'Lecture Hall',
        description: 'Large room',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      deleteRoomType: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Room type already exists'),
    };
    subscriptionPeriodSettings = {
      listSubscriptionPeriods: vi.fn().mockResolvedValue([]),
      createSubscriptionPeriod: vi.fn().mockResolvedValue({
        id: 'period-1',
        name: 'Monthly',
        durationType: 'Month',
        durationValue: 1,
        description: 'Monthly subscription',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      updateSubscriptionPeriod: vi.fn().mockResolvedValue({
        id: 'period-1',
        name: 'Quarterly',
        durationType: 'Month',
        durationValue: 3,
        description: 'Monthly subscription',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      deleteSubscriptionPeriod: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Subscription period already exists'),
    };
    equipmentFacilitySettings = {
      listEquipmentFacilities: vi.fn().mockResolvedValue([
        {
          id: 'equipment-1',
          name: 'Projector',
          description: 'Ceiling projector',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]),
      createEquipmentFacility: vi.fn().mockResolvedValue({
        id: 'equipment-2',
        name: 'Whiteboard',
        description: 'Wall mounted board',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      updateEquipmentFacility: vi.fn().mockResolvedValue({
        id: 'equipment-1',
        name: 'Smart Projector',
        description: 'Interactive projector',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
      deleteEquipmentFacility: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Equipment & Facilities already exists'),
    };
    questionTypeSettings = {
      listQuestionTypes: vi.fn().mockResolvedValue([
        { id: 'question-type-1', name: 'Multiple Choice', code: 'MULTIPLE_CHOICE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'question-type-2', name: 'True / False', code: 'TRUE_FALSE', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'question-type-3', name: 'Short Answer', code: 'SHORT_ANSWER', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'question-type-4', name: 'Essay', code: 'ESSAY', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'question-type-5', name: 'MCQ', code: 'MCQ', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      ]),
      toUserMessage: vi.fn().mockReturnValue('Unable to load question types. Please try again.'),
    };
    questionSourceSettings = {
      listQuestionSources: vi.fn().mockResolvedValue([
        {
          id: 'question-source-1',
          source: 'Official previous exam',
          educationCategory: 'BASIC_EDUCATION',
          description: 'Imported from a formal exam.',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]),
      createQuestionSource: vi.fn().mockResolvedValue({
        id: 'question-source-2',
        source: 'Teacher-made',
        educationCategory: 'UNIVERSITY_EDUCATION',
        description: 'Written by the teacher.',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      toUserMessage: vi.fn().mockReturnValue('Question source already exists'),
    };

    await TestBed.configureTestingModule({
      imports: [TenantPlatformSettingsComponent],
      providers: [
        { provide: TenantCountrySettingsService, useValue: countrySettings },
        { provide: TenantRoomTypeSettingsService, useValue: roomTypeSettings },
        { provide: TenantEquipmentFacilitySettingsService, useValue: equipmentFacilitySettings },
        { provide: TenantSubscriptionPeriodSettingsService, useValue: subscriptionPeriodSettings },
        { provide: TenantQuestionTypeSettingsService, useValue: questionTypeSettings },
        { provide: TenantQuestionSourceSettingsService, useValue: questionSourceSettings },
      ],
    }).compileComponents();
  });

  it('loads backend countries when the country tab is selected and does not show placeholders', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    fixture.detectChanges();

    expect(countrySettings.listCountries).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Brazil');
    expect(fixture.nativeElement.textContent).not.toContain('You do not have permission to manage tenant countries.');
    expect(fixture.nativeElement.textContent).not.toContain('Saudi Arabia');
    expect(fixture.nativeElement.textContent).not.toContain('United Arab Emirates');
  });

  it('opens the add modal and saves a new country through the backend', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await component.selectTab('country');

    component.openCountryModal();
    component.newCountryName.set(' Morocco ');
    await component.saveCountry();
    fixture.detectChanges();

    expect(countrySettings.createCountry).toHaveBeenCalledWith('Morocco');
    expect(component.showCountryModal()).toBe(false);
    expect(component.newCountryName()).toBe('');
    expect(component.countries().map((country) => country.name)).toContain('Morocco');
  });

  it('keeps the modal open for blank and backend-failed saves', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openCountryModal();
    component.newCountryName.set('   ');
    await component.saveCountry();

    expect(component.showCountryModal()).toBe(true);
    expect(component.countryNameError()).toBe('Country name is required.');
    expect(countrySettings.createCountry).not.toHaveBeenCalled();

    countrySettings.createCountry.mockRejectedValueOnce(new Error('duplicate'));
    component.newCountryName.set('Brazil');
    await component.saveCountry();

    expect(component.showCountryModal()).toBe(true);
    expect(component.countrySaveError()).toBe('Country name already exists');
  });

  it('opens the edit modal with existing country data and saves updates through the backend', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    component.openEditCountryModal(component.countries()[0]);
    fixture.detectChanges();

    expect(component.showCountryModal()).toBe(true);
    expect(component.newCountryName()).toBe('Brazil');
    expect(fixture.nativeElement.textContent).toContain('Edit Country');

    component.newCountryName.set(' Jordan ');
    await component.saveCountry();
    fixture.detectChanges();

    expect(countrySettings.updateCountry).toHaveBeenCalledWith('country-1', 'Jordan');
    expect(component.showCountryModal()).toBe(false);
    expect(component.countries().map((country) => country.name)).toContain('Jordan');
  });

  it('renders country edit and delete actions and removes deleted countries', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('country');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[title="Edit country"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[title="Delete country"]')).toBeTruthy();

    await component.deleteCountry(component.countries()[0]);
    fixture.detectChanges();

    expect(countrySettings.deleteCountry).toHaveBeenCalledWith('country-1');
    expect(component.countries()).toEqual([]);
  });

  it('moves Users out of the side tabs and opens it from General', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).not.toContain('Users');
    expect(fixture.nativeElement.textContent).toContain('Users');

    component.openUsersScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('users');
    expect(fixture.nativeElement.textContent).toContain('Manage tenant users and workspace access.');
    expect(fixture.nativeElement.textContent).toContain('Tenant Admin');
  });

  it('moves Country out of the side tabs and opens it from General', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).not.toContain('Country');
    expect(fixture.nativeElement.textContent).toContain('Country');

    await component.openCountriesScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('country');
    expect(countrySettings.listCountries).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Manage countries available in tenant settings.');
    expect(fixture.nativeElement.textContent).toContain('Brazil');
  });

  it('shows the Question Type card in General and opens predefined question types', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).not.toContain('Question Type');
    expect(fixture.nativeElement.textContent).toContain('Question Type');

    await component.openQuestionTypesScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('question-types');
    expect(questionTypeSettings.listQuestionTypes).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Manage predefined question types used by curriculum questions.');
    expect(fixture.nativeElement.textContent).toContain('Multiple Choice');
    expect(fixture.nativeElement.textContent).toContain('True / False');
    expect(fixture.nativeElement.textContent).toContain('Short Answer');
    expect(fixture.nativeElement.textContent).toContain('Essay');
    expect(fixture.nativeElement.textContent).toContain('MCQ');
  });

  it('shows the Question Source card in General and opens backend question sources', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.textContent).not.toContain('Question Source');
    expect(fixture.nativeElement.textContent).toContain('Question Source');

    await component.openQuestionSourcesScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('question-sources');
    expect(questionSourceSettings.listQuestionSources).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Manage source values used by curriculum questions.');
    expect(fixture.nativeElement.textContent).toContain('Source');
    expect(fixture.nativeElement.textContent).toContain('Type');
    expect(fixture.nativeElement.textContent).toContain('Description');
    expect(fixture.nativeElement.textContent).toContain('Official previous exam');
    expect(fixture.nativeElement.textContent).toContain('Basic Education');
    expect(fixture.nativeElement.textContent).toContain('Imported from a formal exam.');
  });

  it('opens the add source modal and saves a question source through the backend', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openQuestionSourcesScreen();
    component.openQuestionSourceModal();
    fixture.detectChanges();

    expect(component.showQuestionSourceModal()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Add New Source');

    component.questionSourceValue.set(' Teacher-made ');
    component.questionSourceEducationCategory.set('UNIVERSITY_EDUCATION');
    component.questionSourceDescription.set(' Written by the teacher. ');
    await component.saveQuestionSource();
    fixture.detectChanges();

    expect(questionSourceSettings.createQuestionSource).toHaveBeenCalledWith({
      source: 'Teacher-made',
      educationCategory: 'UNIVERSITY_EDUCATION',
      description: 'Written by the teacher.',
    });
    expect(component.showQuestionSourceModal()).toBe(false);
    expect(component.questionSources().map((source) => source.source)).toContain('Teacher-made');
  });

  it('keeps the source modal open for blank and backend-failed saves', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openQuestionSourceModal();
    component.questionSourceValue.set('   ');
    await component.saveQuestionSource();

    expect(component.showQuestionSourceModal()).toBe(true);
    expect(component.questionSourceValueError()).toBe('Question source is required.');
    expect(questionSourceSettings.createQuestionSource).not.toHaveBeenCalled();

    questionSourceSettings.createQuestionSource.mockRejectedValueOnce(new Error('duplicate'));
    component.questionSourceValue.set('Official previous exam');
    await component.saveQuestionSource();

    expect(component.showQuestionSourceModal()).toBe(true);
    expect(component.questionSourceSaveError()).toBe('Question source already exists');
  });

  it('shows the Room Type card in General and opens the room types screen', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Room Type');

    await component.openRoomTypesScreen();
    fixture.detectChanges();

    expect(roomTypeSettings.listRoomTypes).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Room Types');
    expect(fixture.nativeElement.textContent).toContain('Classroom');
    expect(fixture.nativeElement.querySelector('[title="Edit room type"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[title="Delete room type"]')).toBeTruthy();
  });

  it('creates and updates room types through the backend service', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openRoomTypesScreen();
    component.openRoomTypeModal();
    component.roomTypeName.set(' Laboratory ');
    component.roomTypeDescription.set(' Science room ');
    await component.saveRoomType();

    expect(roomTypeSettings.createRoomType).toHaveBeenCalledWith({ name: 'Laboratory', description: 'Science room' });
    expect(component.showRoomTypeModal()).toBe(false);
    expect(component.roomTypeStatusModal()?.title).toBe('Room type added');

    component.closeRoomTypeStatusModal();
    component.openEditRoomTypeModal(component.roomTypes()[0]);
    component.roomTypeName.set(' Lecture Hall ');
    component.roomTypeDescription.set(' Large room ');
    await component.saveRoomType();

    expect(roomTypeSettings.updateRoomType).toHaveBeenCalledWith('room-type-1', { name: 'Lecture Hall', description: 'Large room' });
    expect(component.roomTypes().map((roomType) => roomType.name)).toContain('Lecture Hall');
  });

  it('confirms room type deletion and displays a status modal', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openRoomTypesScreen();
    component.confirmDeleteRoomType(component.roomTypes()[0]);
    fixture.detectChanges();

    expect(component.roomTypePendingDelete()?.name).toBe('Classroom');
    expect(fixture.nativeElement.textContent).toContain('Delete room type');

    await component.deleteRoomType();
    fixture.detectChanges();

    expect(roomTypeSettings.deleteRoomType).toHaveBeenCalledWith('room-type-1');
    expect(component.roomTypes()).toEqual([]);
    expect(component.roomTypeStatusModal()?.title).toBe('Room type deleted');
  });

  it('shows the Subscription period card in General and opens period settings', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Subscription period');

    component.subscriptionPeriodsLoaded.set(true);
    await component.openSubscriptionPeriodScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('subscription-period');
    expect(fixture.nativeElement.textContent).toContain('Period Name');
    expect(fixture.nativeElement.textContent).toContain('Actions');
    expect(fixture.nativeElement.textContent).toContain('No subscription periods saved yet.');
  });

  it('opens the Add New Period page and saves a period', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openSubscriptionPeriodScreen();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Add New Period');

    component.openSubscriptionPeriodCreateScreen();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('subscription-period-create');
    expect(fixture.nativeElement.textContent).toContain('Period Name');
    expect(fixture.nativeElement.textContent).toContain('Month');
    expect(fixture.nativeElement.textContent).toContain('Day');
    expect(fixture.nativeElement.textContent).toContain('Description');

    component.subscriptionPeriodName.set('Monthly');
    component.selectSubscriptionPeriodDurationType('Month');
    component.subscriptionPeriodDurationValue.set(1);
    component.subscriptionPeriodDescription.set('Monthly subscription');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Month count');

    await component.saveSubscriptionPeriod();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('subscription-period');
    expect(subscriptionPeriodSettings.createSubscriptionPeriod).toHaveBeenCalledWith({
      name: 'Monthly',
      durationType: 'Month',
      durationValue: 1,
      description: 'Monthly subscription',
    });
    expect(component.subscriptionPeriods()).toEqual([expect.objectContaining({
      id: 'period-1',
      name: 'Monthly',
      durationType: 'Month',
      durationValue: 1,
      description: 'Monthly subscription',
    })]);
    expect(fixture.nativeElement.textContent).toContain('Monthly');
    expect(fixture.nativeElement.textContent).toContain('1 Month');
    expect(fixture.nativeElement.textContent).toContain('Monthly subscription');
    expect(fixture.nativeElement.querySelector('[title="Edit period"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[title="Delete period"]')).toBeTruthy();
  });

  it('edits and deletes saved subscription periods', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.subscriptionPeriods.set([{
      id: 'period-1',
      name: 'Monthly',
      durationType: 'Month',
      durationValue: 1,
      description: 'Monthly subscription',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }]);
    component.subscriptionPeriodsLoaded.set(true);
    await component.openSubscriptionPeriodScreen();
    fixture.detectChanges();

    component.editSubscriptionPeriod(component.subscriptionPeriods()[0]);
    fixture.detectChanges();

    expect(component.activeTab()).toBe('subscription-period-create');
    expect(component.subscriptionPeriodName()).toBe('Monthly');

    component.subscriptionPeriodName.set('Quarterly');
    component.subscriptionPeriodDurationValue.set(3);
    await component.saveSubscriptionPeriod();
    fixture.detectChanges();

    expect(subscriptionPeriodSettings.updateSubscriptionPeriod).toHaveBeenCalledWith('period-1', {
      name: 'Quarterly',
      durationType: 'Month',
      durationValue: 3,
      description: 'Monthly subscription',
    });
    expect(component.subscriptionPeriods()[0]).toEqual(expect.objectContaining({
      id: 'period-1',
      name: 'Quarterly',
      durationType: 'Month',
      durationValue: 3,
      description: 'Monthly subscription',
    }));
    expect(fixture.nativeElement.textContent).toContain('Quarterly');

    await component.deleteSubscriptionPeriod(component.subscriptionPeriods()[0]);
    fixture.detectChanges();

    expect(subscriptionPeriodSettings.deleteSubscriptionPeriod).toHaveBeenCalledWith('period-1');
    expect(component.subscriptionPeriods()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No subscription periods saved yet.');
  });

  it('cancels Add New Period and returns to Subscription period', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openSubscriptionPeriodCreateScreen();
    component.subscriptionPeriodName.set('Daily');

    component.cancelSubscriptionPeriodCreate();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('subscription-period');
    expect(component.subscriptionPeriodName()).toBe('');
  });

  it('shows the Equipment & Facilities card in General and opens the list screen', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.selectTab('general');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Equipment & Facilities');

    await component.openEquipmentFacilitiesScreen();
    fixture.detectChanges();

    expect(equipmentFacilitySettings.listEquipmentFacilities).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Projector');
    expect(fixture.nativeElement.querySelector('[title="Edit equipment and facilities"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[title="Delete equipment and facilities"]')).toBeTruthy();
  });

  it('creates and updates equipment and facilities through the backend service', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openEquipmentFacilitiesScreen();
    component.openEquipmentFacilityModal();
    component.equipmentFacilityName.set(' Whiteboard ');
    component.equipmentFacilityDescription.set(' Wall mounted board ');
    await component.saveEquipmentFacility();

    expect(equipmentFacilitySettings.createEquipmentFacility).toHaveBeenCalledWith({ name: 'Whiteboard', description: 'Wall mounted board' });
    expect(component.showEquipmentFacilityModal()).toBe(false);
    expect(component.equipmentFacilityStatusModal()?.title).toBe('Equipment & Facilities added');

    component.closeEquipmentFacilityStatusModal();
    component.openEditEquipmentFacilityModal(component.equipmentFacilities()[0]);
    component.equipmentFacilityName.set(' Smart Projector ');
    component.equipmentFacilityDescription.set(' Interactive projector ');
    await component.saveEquipmentFacility();

    expect(equipmentFacilitySettings.updateEquipmentFacility).toHaveBeenCalledWith('equipment-1', { name: 'Smart Projector', description: 'Interactive projector' });
    expect(component.equipmentFacilities().map((equipment) => equipment.name)).toContain('Smart Projector');
  });

  it('confirms equipment and facilities deletion and displays a status modal', async () => {
    const fixture = TestBed.createComponent(TenantPlatformSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.openEquipmentFacilitiesScreen();
    component.confirmDeleteEquipmentFacility(component.equipmentFacilities()[0]);
    fixture.detectChanges();

    expect(component.equipmentFacilityPendingDelete()?.name).toBe('Projector');
    expect(fixture.nativeElement.textContent).toContain('Delete equipment and facilities');

    await component.deleteEquipmentFacility();
    fixture.detectChanges();

    expect(equipmentFacilitySettings.deleteEquipmentFacility).toHaveBeenCalledWith('equipment-1');
    expect(component.equipmentFacilities()).toEqual([]);
    expect(component.equipmentFacilityStatusModal()?.title).toBe('Equipment & Facilities deleted');
  });
});
