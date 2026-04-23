export interface TenantUserRoleOption {
  id: string;
  label: string;
  icon: string;
  description: string;
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
  role: string;
  status: string;
  sendInvite: boolean;
  password: string;
}
