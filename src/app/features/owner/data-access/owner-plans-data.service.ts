import { Injectable, signal } from '@angular/core';
import { Plan } from '../models/owner-plans.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlansDataService {
  readonly plans = signal<Plan[]>([
    {
      id: 'pln_starter',
      name: 'Starter',
      status: 'Active',
      monthlyPrice: 49,
      yearlyPrice: 490,
      currency: '$',
      maxStudents: 200,
      maxStorage: 5,
      trialDays: 14,
      visibility: 'Public',
    },
    {
      id: 'pln_pro',
      name: 'Professional',
      status: 'Active',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      currency: '$',
      maxStudents: 1000,
      maxStorage: 50,
      trialDays: 14,
      visibility: 'Public',
    },
    {
      id: 'pln_enterprise',
      name: 'Enterprise',
      status: 'Active',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: '$',
      maxStudents: 10000,
      maxStorage: 500,
      trialDays: 30,
      visibility: 'Private',
    },
  ]);
}
