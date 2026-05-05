export type PlatformRole = 'Super Admin' | 'Support Agent' | 'Billing Manager' | 'Developer' | 'Web User';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';
export type UserPortalType = 'platform' | 'web';

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  role: PlatformRole;
  tenantId?: string;
  status: UserStatus;
  portalType?: UserPortalType;
  lastLogin: string;
  mfaEnabled: boolean;
  createdDate: string;
  avatar?: string;
}
