export type TenantUserRole = 'Admin' | 'Manager' | 'Staff' | 'Teacher';
export type TenantUserStatus = 'Active' | 'Inactive' | 'Pending';

export interface TenantUser {
  id: string;
  userType: 'APP_USER' | 'WEB_USER' | 'LEARNER';
  name: string;
  email: string;
  role: string;
  roleId?: string | null;
  permissions?: string[];
  status: TenantUserStatus;
  registrationDate: string | null;
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
