export type PlatformRole = 'Super Admin' | 'Support Agent' | 'Billing Manager' | 'Developer';
export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: PlatformRole;
  status: UserStatus;
  lastLogin: string;
  mfaEnabled: boolean;
  createdDate: string;
  avatar?: string;
}
