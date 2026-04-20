import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantRoomCreatePayload } from '../models/tenant-room-create.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  readonly availableEquipment = [
    'Projector',
    'AC',
    'Whiteboard',
    'Sound System',
    'Stage',
    'Lab Kits',
    'Safety Gear',
    'Zoom Integration',
    'Recording',
  ];

  getRoomForEdit(roomId: string): TenantRoomCreatePayload {
    if (roomId === '2') {
      return {
        name: 'Physics Lab',
        type: 'Laboratory',
        capacity: 20,
        equipment: ['Lab Kits', 'Projector', 'Safety Gear'],
        notes: 'This room is equipped with high-speed internet and modern teaching aids.',
      };
    }

    return {
      name: 'Room 101',
      type: 'Classroom',
      capacity: 30,
      equipment: ['Projector', 'AC', 'Whiteboard'],
      notes: 'This room is equipped with high-speed internet and modern teaching aids.',
    };
  }

  createOrUpdateRoom(payload: TenantRoomCreatePayload): Observable<void> {
    return this.tenantApi
      .createOrUpdateRoom(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
