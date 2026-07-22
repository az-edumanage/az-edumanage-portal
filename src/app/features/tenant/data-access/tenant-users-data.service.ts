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
    await this.loadUserCollection(`${environment.apiBaseUrl}/tenant/users`, filters);
  }

  async loadLearners(filters: { search?: string; status?: string } = {}): Promise<void> {
    await this.loadUserCollection(`${environment.apiBaseUrl}/tenant/lms/learners`, filters);
  }

  private async loadUserCollection(url: string, filters: { search?: string; status?: string } = {}): Promise<void> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim().toUpperCase());
    }
    const response = await firstValueFrom(
      this.http.get<{ users: TenantAccessUserSummary[] }>(url, { params }),
    );
    this.users.set(response.users.map((user) => this.toUser(user)));
  }

  private toUser(user: TenantAccessUserSummary): TenantUser {
    return {
      id: user.userId,
      userType: user.userType,
      name: user.fullName || user.username,
      email: user.email || '',
      role: user.roleName || 'No role',
      roleId: user.roleId,
      permissions: user.permissions,
      status: user.enabled ? 'Active' : 'Inactive',
      registrationDate: user.createdAt ?? null,
      lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
      avatar: user.avatarUrl ?? undefined,
    };
  }
}
