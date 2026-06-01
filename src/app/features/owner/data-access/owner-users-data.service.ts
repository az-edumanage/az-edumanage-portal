import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PlatformUser, UserStatus } from '../models/owner-users.models';
import { environment } from '../../../../environments/environment';

interface OwnerWebUserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  authProvider: string;
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  tenantId: string | null;
}

@Injectable({ providedIn: 'root' })
export class OwnerUsersDataService {
  private readonly http = inject(HttpClient);
  readonly users = signal<PlatformUser[]>([
    {
      id: 'usr-1',
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@platform.com',
      username: 'ahmed.hassan',
      phoneNumber: '+20 100 000 0001',
      role: 'Super Admin',
      tenantId: 'tnt_001',
      status: 'Active',
      portalType: 'platform',
      lastLogin: 'Just now',
      mfaEnabled: true,
      createdDate: 'Jan 1, 2023',
    },
    {
      id: 'usr-2',
      fullName: 'Sarah Miller',
      email: 'sarah.m@platform.com',
      username: 'sarah.miller',
      phoneNumber: '+20 100 000 0002',
      role: 'Support Agent',
      tenantId: 'tnt_002',
      status: 'Active',
      portalType: 'platform',
      lastLogin: '2 hours ago',
      mfaEnabled: true,
      createdDate: 'Mar 15, 2023',
    },
    {
      id: 'usr-3',
      fullName: 'John Doe',
      email: 'john.d@platform.com',
      username: 'john.doe',
      phoneNumber: '+20 100 000 0003',
      role: 'Billing Manager',
      tenantId: 'tnt_003',
      status: 'Inactive',
      portalType: 'platform',
      lastLogin: '1 day ago',
      mfaEnabled: false,
      createdDate: 'Jun 10, 2023',
    },
    {
      id: 'usr-4',
      fullName: 'Mike Ross',
      email: 'mike.r@platform.com',
      username: 'mike.ross',
      phoneNumber: '+20 100 000 0004',
      role: 'Developer',
      tenantId: 'tnt_004',
      status: 'Suspended',
      portalType: 'platform',
      lastLogin: '2 weeks ago',
      mfaEnabled: true,
      createdDate: 'Aug 5, 2023',
    },
    {
      id: 'usr-5',
      fullName: 'Nadine Ali',
      email: 'nadine.ali@example.com',
      username: 'nadine.ali',
      phoneNumber: '+20 100 000 0005',
      role: 'Web User',
      status: 'Active',
      portalType: 'web',
      lastLogin: 'Never',
      mfaEnabled: false,
      createdDate: 'Apr 30, 2026',
    },
  ]);

  updateUserStatus(userId: string, status: UserStatus): void {
    this.users.update((allUsers) =>
      allUsers.map((user) => (user.id === userId ? { ...user, status } : user)),
    );
  }

  emailExists(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.users().some((user) => user.email.trim().toLowerCase() === normalized);
  }

  usernameExists(username: string): boolean {
    const normalized = username.trim().toLowerCase();
    return this.users().some((user) => (user.username ?? '').trim().toLowerCase() === normalized);
  }

  phoneExists(phoneNumber: string): boolean {
    const normalized = phoneNumber.replace(/\s+/g, '').toLowerCase();
    return this.users().some((user) => (user.phoneNumber ?? '').replace(/\s+/g, '').toLowerCase() === normalized);
  }

  addWebUser(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    username: string;
    tenantId?: string;
    status?: UserStatus;
  }): PlatformUser {
    const user: PlatformUser = {
      id: `usr-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      username: payload.username.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      role: 'Web User',
      tenantId: payload.tenantId,
      status: payload.status ?? 'Active',
      portalType: 'web',
      lastLogin: 'Never',
      mfaEnabled: false,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    this.users.update((allUsers) => [user, ...allUsers]);
    return user;
  }

  async loadWebUsersFromBackend(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<OwnerWebUserResponse[]>(`${environment.apiBaseUrl}/owner/web-users`),
    );
    const mapped = response.map((row) => this.mapBackendWebUser(row));
    this.users.update((allUsers) => {
      const platformUsers = allUsers.filter((user) => user.portalType !== 'web');
      return [...mapped, ...platformUsers];
    });
  }

  private deriveNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'User';
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  private mapBackendWebUser(row: OwnerWebUserResponse): PlatformUser {
    return {
      id: row.id,
      fullName: row.fullName?.trim() || this.deriveNameFromEmail(row.email),
      email: row.email.trim().toLowerCase(),
      username: row.username?.trim() || row.email.trim().toLowerCase(),
      phoneNumber: row.phoneNumber?.trim() || '',
      role: 'Web User',
      tenantId: row.tenantId ?? undefined,
      status: row.enabled ? 'Active' : 'Inactive',
      portalType: 'web',
      lastLogin: row.lastLoginAt ? this.toDateTimeLabel(row.lastLoginAt) : 'Never',
      mfaEnabled: false,
      createdDate: this.toDateLabel(row.createdAt),
      avatar: undefined,
    };
  }

  private toDateLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private toDateTimeLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
