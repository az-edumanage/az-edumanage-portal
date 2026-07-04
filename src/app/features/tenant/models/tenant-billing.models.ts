export type TenantStudentInvoiceStatus = 'unpaid' | 'paid';
export type TenantBillingInvoiceCategory = 'all' | 'paid' | 'unpaid' | 'overdue';

export interface TenantBillingInvoiceSummary {
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

export interface TenantStudentInvoice {
  id: string;
  invoiceRef: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  amount: number;
  currency: string;
  paymentMethodId?: string | null;
  paymentMethodName: string;
  durationType: string;
  durationValue: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: TenantStudentInvoiceStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantStudentInvoiceListResponse {
  items: TenantStudentInvoice[];
  page: number;
  size: number;
  totalItems: number;
  summary: TenantBillingInvoiceSummary;
}

export interface TenantStudentInvoiceQuery {
  status?: TenantStudentInvoiceStatus | '';
  category?: TenantBillingInvoiceCategory;
  search?: string;
  studentId?: string;
  page?: number;
  size?: number;
}
