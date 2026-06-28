import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TaskService } from '../../../core/services/task.service';
import { TenantRoomCreateDataService } from '../data-access/tenant-room-create-data.service';
import { TenantRoomCreateFacade } from './tenant-room-create.facade';
import { TenantRoomCreateStore } from './tenant-room-create.store';

describe('TenantRoomCreateFacade', () => {
  let facade: TenantRoomCreateFacade;
  let dataService: {
    availableRoomTypes: ReturnType<typeof signal<string[]>>;
    availableEquipment: ReturnType<typeof signal<string[]>>;
    loadLookups: ReturnType<typeof vi.fn>;
    getRoomForEdit: ReturnType<typeof vi.fn>;
    createRoomType: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
    createOrUpdateRoom: ReturnType<typeof vi.fn>;
  };
  let navigationTarget: unknown;

  beforeEach(() => {
    navigationTarget = null;
    dataService = {
      availableRoomTypes: signal(['Laboratory']),
      availableEquipment: signal(['Projector']),
      loadLookups: vi.fn().mockResolvedValue(undefined),
      getRoomForEdit: vi.fn().mockResolvedValue({
        name: 'Room 101',
        type: 'Laboratory',
        capacity: 30,
        equipment: [],
        notes: '',
      }),
      createRoomType: vi.fn().mockImplementation(async (name: string) => {
        dataService.availableRoomTypes.update((types) => [...types, name]);
        return name;
      }),
      toUserMessage: vi.fn().mockReturnValue('Unable to save room type. Please try again.'),
      createOrUpdateRoom: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantRoomCreateStore,
        {
          provide: Router,
          useValue: {
            navigate: (target: unknown) => {
              navigationTarget = target;
              return Promise.resolve(true);
            },
          },
        },
        {
          provide: TaskService,
          useValue: {
            getTask: () => undefined,
            removeTask: () => undefined,
            addTask: () => undefined,
          },
        },
        { provide: TenantRoomCreateDataService, useValue: dataService },
      ],
    });

    facade = TestBed.inject(TenantRoomCreateFacade);
  });

  it('patches the first tenant room type after lookup loading', async () => {
    facade.initialize(null);
    await Promise.resolve();
    await Promise.resolve();

    expect(facade.roomForm.get('type')?.value).toBe('Laboratory');
    expect(facade.isLoadingLookups()).toBe(false);
  });

  it('does not submit when the selected room type is not available for the tenant', () => {
    facade.roomForm.patchValue({
      name: 'Room 101',
      type: 'Classroom',
      capacity: 30,
      equipment: [],
      notes: '',
    });

    facade.onSubmit();

    expect(dataService.createOrUpdateRoom).not.toHaveBeenCalled();
    expect(facade.submitError()).toBe('Select an available room type.');
  });

  it('adds a new room type from the selector search and selects it', async () => {
    facade.setRoomTypeSearchQuery('Studio');

    await facade.addRoomTypeFromSearch();

    expect(dataService.createRoomType).toHaveBeenCalledWith('Studio');
    expect(facade.roomForm.get('type')?.value).toBe('Studio');
    expect(facade.roomTypeSearchQuery()).toBe('');
    expect(facade.roomTypeInlineError()).toBeNull();
  });

  it('selects an existing room type from the dropdown options', () => {
    dataService.availableRoomTypes.set([' Laboratory ', 'Lecture Hall']);
    facade.toggleRoomTypeSelector();

    facade.selectRoomType('Lecture Hall');

    expect(facade.roomForm.get('type')?.value).toBe('Lecture Hall');
    expect(facade.selectedRoomTypeLabel()).toBe('Lecture Hall');
    expect(facade.roomForm.get('type')?.touched).toBe(true);
    expect(facade.roomForm.get('type')?.valid).toBe(true);
    expect(facade.roomTypeSelectorOpen()).toBe(false);
  });

  it('keeps selected room types valid when settings contain surrounding whitespace', () => {
    dataService.availableRoomTypes.set([' Laboratory ']);
    facade.roomForm.patchValue({
      name: 'Room 101',
      type: 'Laboratory',
      capacity: 30,
      equipment: [],
      notes: '',
    });

    facade.onSubmit();

    expect(dataService.createOrUpdateRoom).toHaveBeenCalled();
    expect(facade.submitError()).toBeNull();
  });

  it('submits with an available room type and navigates back to rooms', () => {
    facade.roomForm.patchValue({
      name: 'Room 101',
      type: 'Laboratory',
      capacity: 30,
      equipment: ['Projector'],
      notes: '',
    });

    facade.onSubmit();

    expect(dataService.createOrUpdateRoom).toHaveBeenCalledWith(
      {
        name: 'Room 101',
        type: 'Laboratory',
        capacity: 30,
        equipment: ['Projector'],
        notes: '',
      },
      null,
    );
    expect(navigationTarget).toEqual(['/tenant/rooms']);
  });
});
