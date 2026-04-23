export interface SubscriptionTemplate {
  id: string;
  name: string;
  billingCycle: string;
  gracePeriod: number;
  plansCount: number;
  paymentMethodsCount: number;
  discount: string;
  status: 'Active' | 'Draft' | 'Archived';
  hasActiveSubscriptions: boolean;
}
