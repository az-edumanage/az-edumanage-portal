import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type {
  TenantPermissionGroup,
  TenantRoleDetail,
  TenantRoleStatus,
  TenantRoleSummary,
  TenantRoleWriteRequest,
} from '../models/tenant-access-management.models';

@Injectable({ providedIn: 'root' })
export class TenantAccessManagementDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tenant/access`;

  listPermissionGroups(): Observable<{ groups: TenantPermissionGroup[] }> {
    return this.http.get<{ groups: TenantPermissionGroup[] }>(`${this.baseUrl}/permissions`);
  }

  listRoles(filters: { search?: string; status?: TenantRoleStatus | 'ALL' } = {}): Observable<{ roles: TenantRoleSummary[] }> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<{ roles: TenantRoleSummary[] }>(`${this.baseUrl}/roles`, { params });
  }

  getRole(roleId: string): Observable<TenantRoleDetail> {
    return this.http.get<TenantRoleDetail>(`${this.baseUrl}/roles/${roleId}`);
  }

  createRole(payload: TenantRoleWriteRequest): Observable<TenantRoleDetail> {
    return this.http.post<TenantRoleDetail>(`${this.baseUrl}/roles`, payload);
  }

  updateRole(roleId: string, payload: TenantRoleWriteRequest): Observable<TenantRoleDetail> {
    return this.http.put<TenantRoleDetail>(`${this.baseUrl}/roles/${roleId}`, payload);
  }

  updateRoleStatus(roleId: string, status: TenantRoleStatus): Observable<TenantRoleDetail> {
    return this.http.patch<TenantRoleDetail>(`${this.baseUrl}/roles/${roleId}/status`, { status });
  }

  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${roleId}`);
  }
}
