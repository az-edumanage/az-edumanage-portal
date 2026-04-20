import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import { OwnerUserFormValue } from '../models/owner-user-form.models';

@Injectable({ providedIn: 'root' })
export class OwnerUserFormDataService {
  getUserById(userId: string | null): Partial<OwnerUserFormValue> | null {
    if (userId !== 'usr-1') {
      return null;
    }

    return {
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@platform.com',
      role: 'Super Admin',
      requireMfa: true,
      phone: '',
      expiryDate: '',
      ipRestriction: '',
    };
  }

  getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'Super Admin':
        return [
          'Manage Tenants',
          'Manage Billing',
          'Manage Modules',
          'Manage Provisioning',
          'View Monitoring',
          'Impersonate Tenant',
          'View Audit Logs',
          'Manage Users',
        ];
      case 'Support Agent':
        return ['Manage Tenants', 'View Monitoring', 'Impersonate Tenant', 'View Audit Logs'];
      case 'Billing Manager':
        return ['Manage Billing', 'View Audit Logs'];
      case 'Developer':
        return ['View Monitoring', 'View Audit Logs', 'Manage Integrations'];
      default:
        return [];
    }
  }

  saveUser(payload: OwnerUserFormValue): Observable<void> {
    void payload;
    return timer(600).pipe(map(() => void 0));
  }
}
