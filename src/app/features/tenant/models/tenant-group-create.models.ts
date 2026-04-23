export interface TenantGroupSelectorOption {
  id: string;
  name: string;
  subtitle?: string;
  subject?: string;
  level?: string;
  type?: string;
}

export interface TenantGroupPayload {
  name: string;
  grade: string;
  subject: string;
  teacher: string;
  ownedBy: string;
  room: string;
  capacity: number;
  isFixedTime: boolean;
  startTime: string;
  duration: number;
  daySchedules: Record<string, { startTime: string; endTime: string }>;
  fees: number;
  autoInvoice: boolean;
  allowSelfEnroll: boolean;
  hasSpecificDuration: boolean;
  startDate: string;
  endDate: string;
  requireApproval: boolean;
  isActive: boolean;
  scheduleDays: string[];
}

export interface TenantGroupTaskData extends Partial<TenantGroupPayload> {
  scheduleDays?: string[];
}
