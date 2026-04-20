import { Injectable } from '@angular/core';
import { PlanAuditLog, PlanOffer, PlanSubscription } from '../models/owner-plan-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlanDetailsDataService {
  private readonly plans: Record<string, string> = {
    pln_starter: 'Starter',
    pln_pro: 'Professional',
    pln_enterprise: 'Enterprise',
  };

  readonly subscriptions: PlanSubscription[] = [
    { id: 'sub_1', tenantName: 'Bright Academy', startDate: '2024-01-10', endDate: '2025-01-10', status: 'Active', amount: 1490 },
    { id: 'sub_2', tenantName: 'Global Learning', startDate: '2023-12-15', endDate: '2024-12-15', status: 'Active', amount: 1490 },
    { id: 'sub_3', tenantName: 'Tech High', startDate: '2023-11-20', endDate: '2024-11-20', status: 'Active', amount: 1490 },
    { id: 'sub_4', tenantName: 'Future Scholars', startDate: '2023-05-01', endDate: '2024-05-01', status: 'Expired', amount: 1490 },
    { id: 'sub_5', tenantName: 'Elite Prep', startDate: '2023-01-15', endDate: '2024-01-15', status: 'Expired', amount: 1490 },
  ];

  readonly auditLogs: PlanAuditLog[] = [
    { id: 'log_1', action: 'Price Updated', user: 'Admin Sarah', timestamp: '2024-03-15T10:30:00Z', details: 'Monthly price increased from $129 to $149' },
    { id: 'log_2', action: 'Limit Changed', user: 'Admin Mike', timestamp: '2024-02-20T14:45:00Z', details: 'Max students increased from 800 to 1000' },
    { id: 'log_3', action: 'Visibility Changed', user: 'Admin Sarah', timestamp: '2024-01-05T09:15:00Z', details: 'Plan set to Public visibility' },
    { id: 'log_4', action: 'Plan Created', user: 'System', timestamp: '2023-10-01T08:00:00Z', details: 'Initial plan definition created' },
  ];

  readonly offers: PlanOffer[] = [
    { id: 'off_1', code: 'WELCOME20', discount: '20%', validUntil: '2024-12-31', usageCount: 45 },
    { id: 'off_2', code: 'SUMMER50', discount: '50%', validUntil: '2024-08-31', usageCount: 12 },
    { id: 'off_3', code: 'ANNUAL_SAVE', discount: '$100', validUntil: '2025-01-01', usageCount: 89 },
  ];

  getPlanName(id: string | null): string {
    if (!id) return 'Plan';
    return this.plans[id] || 'Plan';
  }
}
