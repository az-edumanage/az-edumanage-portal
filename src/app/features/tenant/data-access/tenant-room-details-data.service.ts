import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { BackendScheduleSession } from '../models/tenant-schedule.models';
import { BackendRoomDetails, RoomDetails, RoomIssueNote, RoomSchedule } from '../models/tenant-room-details.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly roomsUrl = `${environment.apiBaseUrl}/tenant/rooms`;
  private readonly scheduleUrl = `${environment.apiBaseUrl}/tenant/groups/schedule`;

  async getRoomById(id: string | null): Promise<RoomDetails> {
    const roomId = this.requireRoomId(id);
    await this.authApi.ensureLoggedIn();
    const room = await firstValueFrom(this.http.get<BackendRoomDetails>(`${this.roomsUrl}/${roomId}`));
    return this.toRoomDetails(room);
  }

  async getScheduleByRoomId(id: string | null): Promise<RoomSchedule[]> {
    const roomId = this.requireRoomId(id);
    await this.authApi.ensureLoggedIn();
    const sessions = await firstValueFrom(this.http.get<BackendScheduleSession[]>(this.scheduleUrl));
    return (sessions ?? [])
      .filter((session) => session.roomId === roomId)
      .map((session) => this.toRoomSchedule(session));
  }

  async saveIssueNote(id: string | null, note: string): Promise<RoomIssueNote> {
    const roomId = this.requireRoomId(id);
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.post<RoomIssueNote>(`${this.roomsUrl}/${roomId}/issues`, { note }));
  }

  toUserMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to load room details. Please try again.';
  }

  private requireRoomId(id: string | null): string {
    const roomId = id?.trim();
    if (!roomId) {
      throw new Error('Room is required');
    }
    return roomId;
  }

  private toRoomDetails(room: BackendRoomDetails): RoomDetails {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      status: room.status,
      equipment: room.equipment ?? [],
      notes: room.notes ?? '',
    };
  }

  private toRoomSchedule(session: BackendScheduleSession): RoomSchedule {
    return {
      id: session.id,
      groupId: session.groupId,
      day: session.day,
      time: this.formatTimeRange(session.startTime, session.duration),
      group: session.groupName,
      teacher: session.teacherName,
      subject: session.subjectName ?? '',
      studentsCount: session.studentsCount ?? 0,
      durationHours: (session.duration ?? 0) / 60,
    };
  }

  private formatTimeRange(startTime: string, duration: number | null): string {
    if (!duration) {
      return this.formatScheduleTime(startTime);
    }
    const start = this.toMinutes(startTime);
    if (start === null) {
      return this.formatScheduleTime(startTime);
    }
    return `${this.formatMinutes(start)} - ${this.formatMinutes(start + duration)}`;
  }

  private formatScheduleTime(time: string): string {
    const minutes = this.toMinutes(time);
    return minutes === null ? time : this.formatMinutes(minutes);
  }

  private toMinutes(time: string): number | null {
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }
    return hour * 60 + minute;
  }

  private formatMinutes(totalMinutes: number): string {
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  }
}
