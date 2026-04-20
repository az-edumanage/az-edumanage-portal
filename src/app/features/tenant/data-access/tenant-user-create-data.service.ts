import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { TenantApiService } from './tenant-api.service';
import {
  TenantUserCreateForm,
  TenantUserExisting,
  TenantUserRoleOption,
  TenantUserStatusOption,
} from '../models/tenant-user-create.models';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  readonly roles: TenantUserRoleOption[] = [
    {
      id: 'Staff',
      label: 'Staff',
      icon: 'person',
      description: 'Basic administrative tasks and read-only data access.',
    },
    {
      id: 'Teacher',
      label: 'Teacher',
      icon: 'school',
      description: 'Manage groups, attendance, and student grades.',
    },
    {
      id: 'Manager',
      label: 'Manager',
      icon: 'manage_accounts',
      description: 'Department management and academic reporting.',
    },
    {
      id: 'Admin',
      label: 'Admin',
      icon: 'admin_panel_settings',
      description: 'Full system access including billing and settings.',
    },
  ];

  readonly statuses: TenantUserStatusOption[] = [
    { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
    { id: 'Pending', label: 'Pending', color: 'bg-amber-500' },
    { id: 'Inactive', label: 'Inactive', color: 'bg-slate-400' },
  ];

  private readonly existingUsers: TenantUserExisting[] = [
    { name: 'Ahmed Admin', email: 'admin@school.com' },
    { name: 'Sara Manager', email: 'sara.m@school.com' },
    { name: 'John Staff', email: 'john.s@school.com' },
  ];

  isDuplicateName(name: string): Observable<boolean> {
    return of(name).pipe(
      delay(800),
      map((value) =>
        this.existingUsers.some((user) => user.name.toLowerCase() === value.toLowerCase()),
      ),
      catchError(() => of(false)),
    );
  }

  isDuplicateEmail(email: string): Observable<boolean> {
    return of(email).pipe(
      delay(800),
      map((value) =>
        this.existingUsers.some((user) => user.email.toLowerCase() === value.toLowerCase()),
      ),
      catchError(() => of(false)),
    );
  }

  createUser(payload: TenantUserCreateForm): Observable<void> {
    return this.tenantApi
      .createUser(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
