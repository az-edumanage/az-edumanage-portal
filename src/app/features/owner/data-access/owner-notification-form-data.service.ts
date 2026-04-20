import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import { OwnerNotificationFormValue } from '../models/owner-notification-form.models';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationFormDataService {
  saveNotification(payload: OwnerNotificationFormValue): Observable<void> {
    void payload;
    return timer(600).pipe(map(() => void 0));
  }
}
