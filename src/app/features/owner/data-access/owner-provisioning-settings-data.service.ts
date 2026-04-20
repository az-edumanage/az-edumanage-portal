import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import { OwnerProvisioningSettingsFormValue } from '../models/owner-provisioning-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningSettingsDataService {
  saveSettings(payload: OwnerProvisioningSettingsFormValue): Observable<void> {
    void payload;
    return timer(700).pipe(map(() => void 0));
  }
}
