export type TenantBroadcastRole = 'Teacher' | 'Student';

export interface TenantBroadcastMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  role: TenantBroadcastRole;
}
