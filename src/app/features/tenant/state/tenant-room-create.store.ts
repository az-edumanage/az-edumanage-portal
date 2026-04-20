import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantRoomCreateStore {
  readonly isSubmitting = signal(false);
  readonly roomId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.roomId());
  readonly taskId = signal('create-room-task');

  setRoomId(roomId: string | null): void {
    this.roomId.set(roomId);
    this.taskId.set(roomId ? `edit-room-${roomId}` : 'create-room-task');
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
