import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantRoomBookingForm } from '../models/tenant-room-booking.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomBookingDataService {
  private readonly tenantApi = inject(TenantApiService);

  getRoomName(roomId: string | null): string {
    if (roomId === '2') {
      return 'Physics Lab';
    }

    return 'Room 101';
  }

  bookRoom(payload: TenantRoomBookingForm): Observable<void> {
    return this.tenantApi
      .bookRoom(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
