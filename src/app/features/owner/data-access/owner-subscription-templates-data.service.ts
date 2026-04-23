import { Injectable, signal } from '@angular/core';
import { SubscriptionTemplate } from '../models/owner-subscription-templates.models';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionTemplatesDataService {
  readonly templates = signal<SubscriptionTemplate[]>([
    {
      id: 'TMP_001',
      name: 'Standard Annual Contract',
      billingCycle: 'Yearly',
      gracePeriod: 15,
      plansCount: 3,
      paymentMethodsCount: 4,
      discount: '10%',
      status: 'Active',
      hasActiveSubscriptions: true,
    },
    {
      id: 'TMP_002',
      name: 'Monthly Flexible Plan',
      billingCycle: 'Monthly',
      gracePeriod: 5,
      plansCount: 2,
      paymentMethodsCount: 2,
      discount: 'None',
      status: 'Active',
      hasActiveSubscriptions: false,
    },
    {
      id: 'TMP_003',
      name: 'Semester Academic Pack',
      billingCycle: 'Semester',
      gracePeriod: 30,
      plansCount: 1,
      paymentMethodsCount: 3,
      discount: '$50 Fixed',
      status: 'Draft',
      hasActiveSubscriptions: false,
    },
  ]);
}
