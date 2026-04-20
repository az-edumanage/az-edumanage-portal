export type IntegrationType = 'Payment' | 'SMS' | 'Email' | 'Storage' | 'Identity';
export type IntegrationStatus = 'Connected' | 'Not Configured' | 'Error';
export type IntegrationMode = 'Test' | 'Live';

export interface Integration {
  id: string;
  name: string;
  provider: string;
  type: IntegrationType;
  status: IntegrationStatus;
  mode: IntegrationMode;
  lastHealthCheck: string;
  icon: string;
  description: string;
}
