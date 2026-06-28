export type TenantStudentInvoiceStatus = 'unpaid' | 'paid';

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
}

export interface TenantStudentInvoiceQuery {
  status?: TenantStudentInvoiceStatus | '';
  search?: string;
  page?: number;
  size?: number;
}
