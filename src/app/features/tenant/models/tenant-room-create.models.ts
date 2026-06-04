export type TenantRoomType = string;

export interface TenantRoomCreatePayload {
  name: string;
  type: TenantRoomType;
  capacity: number;
  equipment: string[];
  notes: string;
}
