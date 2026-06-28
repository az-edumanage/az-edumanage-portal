import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import type { TenantAccessUserSummary, TenantRoleSummary, TenantUserWriteRequest } from '../models/tenant-access-management.models';
import {
  TenantUserCreateForm,
  TenantUserRoleOption,
  TenantUserStatusOption,
} from '../models/tenant-user-create.models';

@Injectable({ providedIn: 'root' })
export class TenantUserCreateDataService {
  private readonly http = inject(HttpClient);

  readonly statuses: TenantUserStatusOption[] = [
    { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
    { id: 'Inactive', label: 'Inactive', color: 'bg-slate-400' },
  ];

  loadActiveRoles(): Observable<TenantUserRoleOption[]> {
    return this.http.get<{ roles: TenantRoleSummary[] }>(`${environment.apiBaseUrl}/tenant/access/roles`, {
      params: { status: 'ACTIVE' },
    }).pipe(
      map((response) => response.roles.map((role) => ({
        id: role.id,
        label: role.name,
        icon: role.protectedRole ? 'admin_panel_settings' : 'security',
        description: `${role.permissions.length} permissions`,
        permissions: role.permissions,
      }))),
      catchError(() => of([])),
    );
  }

  isDuplicateName(_name: string): Observable<boolean> {
    return of(false);
  }

  isDuplicateEmail(_email: string): Observable<boolean> {
    return of(false);
  }

  createUser(payload: TenantUserCreateForm): Observable<TenantAccessUserSummary> {
    return this.http.post<TenantAccessUserSummary>(
      `${environment.apiBaseUrl}/tenant/users`,
      this.toCreateRequest(payload),
    );
  }

  updateUser(userId: string, payload: TenantUserCreateForm): Observable<TenantAccessUserSummary> {
    return this.http.put<TenantAccessUserSummary>(
      `${environment.apiBaseUrl}/tenant/users/${userId}`,
      this.toUpdateRequest(payload),
    );
  }

  loadUser(userId: string): Observable<TenantAccessUserSummary | null> {
    return this.http.get<{ users: TenantAccessUserSummary[] }>(`${environment.apiBaseUrl}/tenant/users`).pipe(
      map((response) => response.users.find((user) => user.userId === userId) ?? null),
      catchError(() => of(null)),
    );
  }

  private toCreateRequest(payload: TenantUserCreateForm): TenantUserWriteRequest {
    return {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      username: payload.username.trim(),
      roleId: payload.roleId,
      enabled: payload.enabled,
      sendInvite: payload.sendInvite,
      password: payload.password,
    };
  }

  private toUpdateRequest(payload: TenantUserCreateForm): TenantUserWriteRequest {
    return {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      username: payload.username.trim(),
      roleId: payload.roleId,
      enabled: payload.enabled,
      sendInvite: payload.sendInvite,
      password: null,
    };
  }
}
