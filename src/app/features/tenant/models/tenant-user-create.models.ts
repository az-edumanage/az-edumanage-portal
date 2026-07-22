export interface TenantUserRoleOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  permissions?: string[];
}

export interface TenantUserStatusOption {
  id: string;
  label: string;
  color: string;
}

export interface TenantUserExisting {
  name: string;
  email: string;
}

export interface TenantUserCreateForm {
  fullName: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  roleId: string;
  enabled: boolean;
  sendInvite: boolean;
  password: string | null;
}
