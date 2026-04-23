export interface Alert {
  id: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'Info';
  timestamp: string;
  status: 'Open' | 'Acknowledged' | 'Resolved';
  assignedTo: string;
}

export interface TenantHealth {
  name: string;
  plan: string;
  storageUsed: string;
  apiUsage: string;
  errorCount: number;
  status: 'Healthy' | 'Degraded' | 'Critical';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'Error' | 'Warning' | 'Info';
  tenant: string;
  message: string;
}
