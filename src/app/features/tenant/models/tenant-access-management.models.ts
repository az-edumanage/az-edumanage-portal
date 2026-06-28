export type TenantRoleStatus = 'ACTIVE' | 'INACTIVE';

export interface TenantPermissionDefinition {
  key: string;
  label: string;
  description?: string | null;
  actionType: string;
  sensitive: boolean;
}

export interface TenantPermissionGroup {
  key: string;
  label: string;
  permissions: TenantPermissionDefinition[];
}

export interface TenantRoleSummary {
  id: string;
  name: string;
  description?: string | null;
  status: TenantRoleStatus;
  permissions: string[];
  userAssignmentCount: number;
  protectedRole: boolean;
  updatedAt?: string | null;
}

export interface TenantRoleDetail extends TenantRoleSummary {
  createdByUsername?: string | null;
  updatedByUsername?: string | null;
  createdAt?: string | null;
}

export interface TenantRoleWriteRequest {
  name: string;
  description?: string | null;
  permissionKeys: string[];
}

export interface TenantRoleAssignmentSummary {
  roleId: string | null;
  roleName: string | null;
  assignedAt?: string | null;
}

export interface TenantAccessUserSummary {
  userId: string;
  userType: 'APP_USER' | 'WEB_USER';
  username: string;
  email?: string | null;
  fullName?: string | null;
  enabled: boolean;
  workspaceRole: string;
  roleId?: string | null;
  roleName?: string | null;
  permissions: string[];
  lastLoginAt?: string | null;
}

export interface TenantUserWriteRequest {
  fullName: string;
  email: string;
  username: string;
  roleId: string;
  enabled: boolean;
  sendInvite?: boolean;
  password?: string | null;
}
