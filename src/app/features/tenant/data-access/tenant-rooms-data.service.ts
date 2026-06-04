import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Room } from '../models/tenant-rooms.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly roomsUrl = `${environment.apiBaseUrl}/tenant/rooms`;

  readonly rooms = signal<Room[]>([]);

  async loadRooms(): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<Room[]>(this.roomsUrl));
    this.rooms.set(response ?? []);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.roomsUrl}/${roomId}`));
    this.rooms.update((rooms) => rooms.filter((room) => room.id !== roomId));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return "Couldn't delete room because it is related with group";
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Room could not be deleted. Please try again.';
  }
}
