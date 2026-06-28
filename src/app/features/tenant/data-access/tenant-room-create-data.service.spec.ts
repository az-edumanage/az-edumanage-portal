import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantEquipmentFacilitySettingsService } from './tenant-equipment-facility-settings.service';
import { TenantRoomCreateDataService } from './tenant-room-create-data.service';
import { TenantRoomTypeSettingsService } from './tenant-room-type-settings.service';

describe('TenantRoomCreateDataService', () => {
  let service: TenantRoomCreateDataService;
  let httpTesting: HttpTestingController;
  let roomTypeSettings: {
    listRoomTypes: ReturnType<typeof vi.fn>;
    createRoomType: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    roomTypeSettings = {
      listRoomTypes: vi.fn().mockResolvedValue([]),
      createRoomType: vi.fn().mockResolvedValue({
        id: 'room-type-1',
        name: 'Studio',
        description: null,
        createdAt: '2026-06-02T00:00:00Z',
        updatedAt: '2026-06-02T00:00:00Z',
      }),
      toUserMessage: vi.fn().mockReturnValue('Unable to save room type. Please try again.'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthApiService,
          useValue: {
            ensureLoggedIn: () => Promise.resolve(),
          },
        },
        {
          provide: TenantRoomTypeSettingsService,
          useValue: roomTypeSettings,
        },
        {
          provide: TenantEquipmentFacilitySettingsService,
          useValue: {
            listEquipmentFacilities: () => Promise.resolve([]),
          },
        },
      ],
    });
    service = TestBed.inject(TenantRoomCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('posts a room create request with only tenant-available equipment', async () => {
    service.availableEquipment.set(['Projector']);

    const actual = firstValueFrom(
      service.createOrUpdateRoom(
        {
          name: ' Room 101 ',
          type: ' Laboratory ',
          capacity: 30,
          equipment: ['Projector', 'Unavailable Equipment'],
          notes: ' Notes ',
        },
        null,
      ),
    );
    await Promise.resolve();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/rooms`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Room 101',
      type: 'Laboratory',
      capacity: 30,
      equipment: ['Projector'],
      notes: 'Notes',
    });
    request.flush({
      id: 'room-1',
      name: 'Room 101',
      type: 'Laboratory',
      capacity: 30,
      status: 'Available',
      equipment: ['Projector'],
      activeGroups: 0,
      notes: 'Notes',
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
    });

    await actual;
  });

  it('creates a room type and appends it to the available room types', async () => {
    service.availableRoomTypes.set(['Laboratory']);

    const created = await service.createRoomType('Studio');

    expect(roomTypeSettings.createRoomType).toHaveBeenCalledWith({
      name: 'Studio',
      description: null,
    });
    expect(created).toBe('Studio');
    expect(service.availableRoomTypes()).toEqual(['Laboratory', 'Studio']);
  });
});
