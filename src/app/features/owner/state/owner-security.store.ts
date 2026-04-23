import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerSecurityStore {
  readonly taskId = signal('security-settings-task');
}
