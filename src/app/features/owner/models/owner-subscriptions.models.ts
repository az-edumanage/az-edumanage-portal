export interface Subscription {
  id: string;
  tenantName: string;
  planName: string;
  startDate: string;
  endDate: string;
  billingCycle: 'Monthly' | 'Yearly';
  status: 'Active' | 'Trial' | 'Suspended' | 'Cancelled' | 'Past Due';
  autoRenew: boolean;
  amount: number;
}
