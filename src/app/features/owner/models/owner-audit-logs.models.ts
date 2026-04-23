export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  tenantName: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
  details: {
    description: string;
    oldValue?: string | object;
    newValue?: string | object;
    deviceInfo: string;
    correlationId: string;
    requestId: string;
  };
}
