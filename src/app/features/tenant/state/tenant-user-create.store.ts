import { Injectable, signal } from '@angular/core';
import type { TenantUserRoleOption } from '../models/tenant-user-create.models';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateStore {
  readonly isSubmitting = signal(false);
  readonly taskId = signal('create-user-task');
  readonly roles = signal<TenantUserRoleOption[]>([]);

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setRoles(roles: TenantUserRoleOption[]): void {
    this.roles.set(roles);
  }
}
