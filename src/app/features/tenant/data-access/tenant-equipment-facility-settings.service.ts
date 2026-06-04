import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export interface TenantEquipmentFacility {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantEquipmentFacilityPayload {
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantEquipmentFacilitySettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly equipmentFacilitiesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/equipment-facilities`;

  async listEquipmentFacilities(search = ''): Promise<TenantEquipmentFacility[]> {
    await this.authApi.ensureLoggedIn();
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    const response = await firstValueFrom(this.http.get<TenantEquipmentFacility[]>(this.equipmentFacilitiesUrl, { params }));
    return response ?? [];
  }

  async createEquipmentFacility(payload: TenantEquipmentFacilityPayload): Promise<TenantEquipmentFacility> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantEquipmentFacility>(this.equipmentFacilitiesUrl, this.toRequest(payload)));
  }

  async updateEquipmentFacility(equipmentFacilityId: string, payload: TenantEquipmentFacilityPayload): Promise<TenantEquipmentFacility> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantEquipmentFacility>(`${this.equipmentFacilitiesUrl}/${equipmentFacilityId}`, this.toRequest(payload)));
  }

  async deleteEquipmentFacility(equipmentFacilityId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.equipmentFacilitiesUrl}/${equipmentFacilityId}`));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage equipment and facilities.';
      }
    }
    return 'Unable to save equipment and facilities. Please try again.';
  }

  private toRequest(payload: TenantEquipmentFacilityPayload): TenantEquipmentFacilityPayload {
    return {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    };
  }

  private extractApiMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }
    const apiError = error as { message?: unknown; details?: unknown };
    if (Array.isArray(apiError.details)) {
      const first = apiError.details.find((detail): detail is string => typeof detail === 'string' && detail.trim().length > 0);
      if (first) {
        return first.trim();
      }
    }
    if (typeof apiError.message === 'string' && apiError.message.trim()) {
      return apiError.message.trim();
    }
    return null;
  }
}
