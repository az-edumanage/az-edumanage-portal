export type Tab = 'invoices' | 'payments' | 'failed' | 'refunds' | 'settings' | 'reports';

export interface Invoice {
  id: string;
  tenant: string;
  tenantId: string;
  plan: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'Refunded';
}

export interface Payment {
  id: string;
  tenant: string;
  tenantId: string;
  amount: number;
  method: 'Card' | 'PayPal' | 'Bank Transfer';
  status: 'Success' | 'Failed' | 'Pending';
  date: string;
  ref: string;
}

export interface FailedPayment {
  id: string;
  tenant: string;
  amount: number;
  reason: string;
  retryCount: number;
  lastAttempt: string;
  gracePeriodEnd: string;
}

export interface Refund {
  id: string;
  tenant: string;
  originalInvoice: string;
  amount: number;
  reason: string;
  date: string;
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  refunds: number;
  netRevenue: number;
  growth: number;
  status: 'up' | 'down' | 'stable';
}
