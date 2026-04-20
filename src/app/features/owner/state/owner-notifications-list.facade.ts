import { Injectable, inject } from '@angular/core';
import { OwnerNotificationsListStore } from './owner-notifications-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationsListFacade {
  private readonly store = inject(OwnerNotificationsListStore);

  readonly notifications = this.store.notifications;
}
