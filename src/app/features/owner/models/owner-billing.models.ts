export type Tab = 'invoices' | 'payments' | 'failed' | 'refunds' | 'settings' | 'reports';

export interface Invoice {
  id: string;
  tenant: string;
  tenantId: string;
  plan: string;
  planId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  invoiceRef?: string;
  tenantName?: string;
  planName?: string;
  invoiceType?: 'first_payment' | 'renewal' | string;
  currency?: string;
  providerPaymentStatusSnapshot?: string | null;
  settlementStatus?: 'provider_paid' | 'manual_paid' | 'unpaid' | 'failed' | 'unknown' | string;
  invoiceStatus?: 'paid' | 'open' | 'overdue' | string;
  source?: 'payment_webhook' | 'manual_admin_activation' | string | null;
  invoiceSource?: 'payment_webhook' | 'manual_admin_activation' | string | null;
  paidAt?: string | null;
  paymentTransactionId?: string | null;
  paymentTransactionRef?: string | null;
  manualSettlementId?: string | null;
  manualInvoiceRef?: string | null;
  createdBy?: string | null;
  manualActivationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  billingCycle?: string | null;
  subscriptionCycleId?: number | null;
  graceUntil?: string | null;
}

export interface OwnerBillingInvoiceListResponse {
  items: Invoice[];
  page?: number;
  size?: number;
  totalItems?: number;
}

export interface OwnerBillingInvoiceQuery {
  page?: number;
  size?: number;
  tenantId?: string | null;
  status?: string | null;
  invoiceStatus?: string | null;
  settlementStatus?: string | null;
  invoiceType?: string | null;
  source?: string | null;
  search?: string | null;
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
