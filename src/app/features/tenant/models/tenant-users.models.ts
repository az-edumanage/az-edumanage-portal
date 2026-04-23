export type TenantUserRole = 'Admin' | 'Manager' | 'Staff' | 'Teacher';
export type TenantUserStatus = 'Active' | 'Inactive' | 'Pending';

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: TenantUserRole;
  status: TenantUserStatus;
  lastLogin: string;
  avatar?: string;
}

export interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requestedRole: string;
  date: string;
}
