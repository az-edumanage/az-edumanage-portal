import { Injectable, inject } from '@angular/core';
import { OwnerNotificationsDataService } from '../data-access/owner-notifications-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationsListStore {
  private readonly data = inject(OwnerNotificationsDataService);

  readonly notifications = this.data.notifications;
}
