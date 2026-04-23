export type SubscriptionOrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';

export interface SubscriptionOrder {
  id: string;
  tenantName: string;
  templateName: string;
  amount: number;
  status: SubscriptionOrderStatus;
  paymentMethod: string;
  orderDate: string;
  attachmentUrl?: string;
}

export type SubscriptionOrderActionType = 'approve' | 'reject';
export type SubscriptionOrderExportFormat = 'excel' | 'pdf';
export type SubscriptionOrderExportPdfType = 'details' | 'rows';
export type SubscriptionOrderExportMode = 'all' | 'page' | 'filtered';
