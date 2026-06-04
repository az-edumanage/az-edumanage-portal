import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, from, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantEquipmentFacilitySettingsService } from './tenant-equipment-facility-settings.service';
import { TenantRoomTypeSettingsService } from './tenant-room-type-settings.service';
import { TenantRoomCreatePayload } from '../models/tenant-room-create.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly roomTypeSettings = inject(TenantRoomTypeSettingsService);
  private readonly equipmentFacilitySettings = inject(TenantEquipmentFacilitySettingsService);
  private readonly roomsUrl = `${environment.apiBaseUrl}/tenant/rooms`;

  readonly availableRoomTypes = signal<string[]>([]);
  readonly availableEquipment = signal<string[]>([]);

  async loadLookups(): Promise<void> {
    const [roomTypes, equipmentFacilities] = await Promise.all([
      this.roomTypeSettings.listRoomTypes(),
      this.equipmentFacilitySettings.listEquipmentFacilities(),
    ]);
    this.availableRoomTypes.set(roomTypes.map((type) => type.name));
    this.availableEquipment.set(equipmentFacilities.map((equipment) => equipment.name));
  }

  async getRoomForEdit(roomId: string): Promise<TenantRoomCreatePayload> {
    await this.authApi.ensureLoggedIn();
    const room = await firstValueFrom(this.http.get<TenantRoomCreatePayload>(`${this.roomsUrl}/${roomId}`));
    return this.toFormPayload(room);
  }

  createOrUpdateRoom(payload: TenantRoomCreatePayload, roomId: string | null): Observable<void> {
    return from(this.saveRoom(payload, roomId));
  }

  private async saveRoom(payload: TenantRoomCreatePayload, roomId: string | null): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const request = this.toRequest(payload);
    if (roomId) {
      await firstValueFrom(this.http.put(`${this.roomsUrl}/${roomId}`, request));
      return;
    }
    await firstValueFrom(this.http.post(this.roomsUrl, request));
  }

  private toRequest(payload: TenantRoomCreatePayload): TenantRoomCreatePayload {
    const availableEquipment = new Set(this.availableEquipment().map((item) => item.trim().toLowerCase()));
    return {
      name: payload.name.trim(),
      type: payload.type.trim(),
      capacity: Number(payload.capacity),
      equipment: (payload.equipment ?? [])
        .map((item) => item.trim())
        .filter((item) => item && availableEquipment.has(item.toLowerCase())),
      notes: payload.notes?.trim() ?? '',
    };
  }

  private toFormPayload(payload: TenantRoomCreatePayload): TenantRoomCreatePayload {
    return {
      name: payload.name,
      type: payload.type,
      capacity: payload.capacity,
      equipment: payload.equipment ?? [],
      notes: payload.notes ?? '',
    };
  }

}
