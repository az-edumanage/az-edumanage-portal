import { Injectable, inject } from '@angular/core';
import { TenantGroupBroadcastStore } from './tenant-group-broadcast.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupBroadcastFacade {
  private readonly store = inject(TenantGroupBroadcastStore);

  readonly groupId = this.store.groupId;
  readonly isPublic = this.store.isPublic;
  readonly newMessage = this.store.newMessage;
  readonly messages = this.store.messages;
  readonly onlineStudents = this.store.onlineStudents;

  loadGroup(id: string | null): void {
    this.store.loadGroup(id);
  }

  togglePublic(): void {
    this.store.setPublic(!this.isPublic());
  }

  setNewMessage(value: string): void {
    this.store.setNewMessage(value);
  }

  sendMessage(): boolean {
    return this.store.sendMessage();
  }

  goLiveMessage(): string {
    return 'Starting Live Video Stream...';
  }
}
