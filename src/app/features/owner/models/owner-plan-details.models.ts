export interface PlanSubscription {
  id: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Canceled';
  amount: number;
}

export interface PlanAuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface PlanOffer {
  id: string;
  code: string;
  discount: string;
  validUntil: string;
  usageCount: number;
}
