import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningSettingsStore {
  readonly taskId = signal('provisioning-settings-task');
}
