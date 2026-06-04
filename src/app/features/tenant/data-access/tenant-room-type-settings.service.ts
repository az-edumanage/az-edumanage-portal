import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';

export interface TenantRoomType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantRoomTypePayload {
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantRoomTypeSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly roomTypesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/room-types`;

  async listRoomTypes(search = ''): Promise<TenantRoomType[]> {
    await this.authApi.ensureLoggedIn();
    const params = search.trim() ? new HttpParams().set('search', search.trim()) : undefined;
    const response = await firstValueFrom(this.http.get<TenantRoomType[]>(this.roomTypesUrl, { params }));
    return response ?? [];
  }

  async createRoomType(payload: TenantRoomTypePayload): Promise<TenantRoomType> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantRoomType>(this.roomTypesUrl, this.toRequest(payload)));
  }

  async updateRoomType(roomTypeId: string, payload: TenantRoomTypePayload): Promise<TenantRoomType> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantRoomType>(`${this.roomTypesUrl}/${roomTypeId}`, this.toRequest(payload)));
  }

  async deleteRoomType(roomTypeId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.roomTypesUrl}/${roomTypeId}`));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage room types.';
      }
    }
    return 'Unable to save room type. Please try again.';
  }

  private toRequest(payload: TenantRoomTypePayload): TenantRoomTypePayload {
    const description = payload.description?.trim() || null;
    return {
      name: payload.name.trim(),
      description,
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
