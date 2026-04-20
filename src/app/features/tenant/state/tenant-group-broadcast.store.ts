import { Injectable, inject, signal } from '@angular/core';
import { TenantGroupBroadcastDataService } from '../data-access/tenant-group-broadcast-data.service';
import { TenantBroadcastMessage } from '../models/tenant-group-broadcast.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupBroadcastStore {
  private readonly data = inject(TenantGroupBroadcastDataService);

  readonly groupId = signal<string | null>(null);
  readonly isPublic = signal(false);
  readonly newMessage = signal('');
  readonly messages = signal<TenantBroadcastMessage[]>([]);
  readonly onlineStudents = signal<string[]>([]);

  loadGroup(groupId: string | null): void {
    this.groupId.set(groupId);
    this.messages.set(this.data.getMessagesByGroupId(groupId));
    this.onlineStudents.set(this.data.getOnlineStudentsByGroupId(groupId));
  }

  setPublic(value: boolean): void {
    this.isPublic.set(value);
  }

  setNewMessage(value: string): void {
    this.newMessage.set(value);
  }

  sendMessage(): boolean {
    const text = this.newMessage().trim();
    if (!text) {
      return false;
    }

    const next = this.data.createOutgoingMessage(text);
    this.messages.update((current) => [...current, next]);
    this.newMessage.set('');

    return true;
  }
}
