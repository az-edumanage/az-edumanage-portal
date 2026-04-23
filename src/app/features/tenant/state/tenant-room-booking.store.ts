import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantRoomBookingStore {
  readonly roomId = signal<string | null>(null);
  readonly roomName = signal('Room 101');
  readonly isSubmitting = signal(false);
  readonly taskId = signal('');

  setRoomId(roomId: string | null): void {
    this.roomId.set(roomId);
    this.taskId.set(`booking-room-${roomId}`);
  }

  setRoomName(roomName: string): void {
    this.roomName.set(roomName);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
