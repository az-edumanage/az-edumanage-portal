import { Injectable, signal } from '@angular/core';
import { Subscription } from '../models/owner-subscriptions.models';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionsDataService {
  readonly subscriptions = signal<Subscription[]>([
    {
      id: 'sub_001',
      tenantName: 'Bright Future Academy',
      planName: 'Enterprise',
      startDate: 'Jan 15, 2024',
      endDate: 'Jan 15, 2025',
      billingCycle: 'Yearly',
      status: 'Active',
      autoRenew: true,
      amount: 4990,
    },
    {
      id: 'sub_002',
      tenantName: 'Cairo Math Center',
      planName: 'Professional',
      startDate: 'Feb 02, 2024',
      endDate: 'Feb 16, 2024',
      billingCycle: 'Monthly',
      status: 'Trial',
      autoRenew: true,
      amount: 149,
    },
    {
      id: 'sub_003',
      tenantName: 'Elite Tutors',
      planName: 'Starter',
      startDate: 'Dec 10, 2023',
      endDate: 'Mar 10, 2024',
      billingCycle: 'Monthly',
      status: 'Active',
      autoRenew: true,
      amount: 49,
    },
    {
      id: 'sub_004',
      tenantName: 'Physics Pro',
      planName: 'Professional',
      startDate: 'Jan 20, 2024',
      endDate: 'Feb 20, 2024',
      billingCycle: 'Monthly',
      status: 'Past Due',
      autoRenew: true,
      amount: 149,
    },
    {
      id: 'sub_005',
      tenantName: 'Language Hub',
      planName: 'Starter',
      startDate: 'Nov 05, 2023',
      endDate: 'Dec 05, 2023',
      billingCycle: 'Monthly',
      status: 'Suspended',
      autoRenew: false,
      amount: 49,
    },
  ]);
}
