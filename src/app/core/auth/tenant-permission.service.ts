import { Injectable, inject } from '@angular/core';

import { AuthIdentityService } from './auth-identity.service';

@Injectable({ providedIn: 'root' })
export class TenantPermissionService {
  private readonly identity = inject(AuthIdentityService);

  hasPermission(permission: string | null | undefined): boolean {
    if (!permission) {
      return true;
    }
    return this.identity.hasPermission(permission);
  }

  hasAnyPermission(permissions: readonly string[] | null | undefined): boolean {
    if (!permissions?.length) {
      return true;
    }
    return this.identity.hasAnyPermission(permissions);
  }

  hasAllPermissions(permissions: readonly string[] | null | undefined): boolean {
    if (!permissions?.length) {
      return true;
    }
    return permissions.every((permission) => this.identity.hasPermission(permission));
  }
}
