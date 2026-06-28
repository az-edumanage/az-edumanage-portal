import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { TenantAccessUserSummary } from '../models/tenant-access-management.models';
import { PendingRequest, TenantUser } from '../models/tenant-users.models';

@Injectable({ providedIn: 'root' })
export class TenantUsersDataService {
  private readonly http = inject(HttpClient);

  readonly users = signal<TenantUser[]>([]);
  readonly pendingRequests = signal<PendingRequest[]>([]);

  async loadUsers(filters: { search?: string; status?: string } = {}): Promise<void> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim().toUpperCase());
    }
    const response = await firstValueFrom(
      this.http.get<{ users: TenantAccessUserSummary[] }>(`${environment.apiBaseUrl}/tenant/users`, { params }),
    );
    this.users.set(response.users.map((user) => this.toUser(user)));
  }

  private toUser(user: TenantAccessUserSummary): TenantUser {
    return {
      id: user.userId,
      name: user.fullName || user.username,
      email: user.email || user.username,
      role: user.roleName || 'No role',
      roleId: user.roleId,
      permissions: user.permissions,
      status: user.enabled ? 'Active' : 'Inactive',
      lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
    };
  }
}
