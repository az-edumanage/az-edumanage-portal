export interface OwnerRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
  updatedAt: string;
}

export interface OwnerRoleUpsertPayload {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
}
