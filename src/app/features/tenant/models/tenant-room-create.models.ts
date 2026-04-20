export type TenantRoomType = 'Classroom' | 'Laboratory' | 'Virtual' | 'Auditorium';

export interface TenantRoomCreatePayload {
  name: string;
  type: TenantRoomType;
  capacity: number;
  equipment: string[];
  notes: string;
}
