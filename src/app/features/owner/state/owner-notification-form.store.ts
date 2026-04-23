import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationFormStore {
  readonly taskId = signal('create-notification-task');
}
