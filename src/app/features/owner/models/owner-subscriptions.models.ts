export interface Subscription {
  id: string;
  tenantName: string;
  planName: string;
  startDate: string;
  endDate: string;
  billingCycle: 'Monthly' | 'Yearly';
  status: string;
  autoRenew: boolean;
  amount: number;
}
