import { Integration } from './owner-integrations.models';

export type OwnerIntegrationDetailsTab = 'overview' | 'configuration' | 'health' | 'logs';
export type OwnerIntegrationHealthStatus = 'Unknown' | 'Healthy' | 'Unhealthy';

export interface OwnerIntegrationLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'Success' | 'Error';
  details: string;
}

export interface OwnerIntegrationConfigValue {
  isLive: boolean;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface OwnerIntegrationHealthResult {
  healthStatus: OwnerIntegrationHealthStatus;
  message: string;
  log: string;
  lastHealthCheck: string;
}

export interface OwnerIntegrationDetailsSeed {
  integration: Integration;
  logs: OwnerIntegrationLog[];
}
