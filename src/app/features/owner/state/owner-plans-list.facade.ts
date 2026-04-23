import { Injectable, inject } from '@angular/core';
import { Plan } from '../models/owner-plans.models';
import { OwnerPlansListStore } from './owner-plans-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerPlansListFacade {
  private readonly store = inject(OwnerPlansListStore);

  readonly plans = this.store.plans;

  calculateSavings(plan: Plan): number {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  }

  togglePlanStatus(plan: Plan): void {
    this.plans.update((currentPlans) =>
      currentPlans.map((planItem) =>
        planItem.id === plan.id
          ? { ...planItem, status: planItem.status === 'Active' ? 'Archived' : 'Active' }
          : planItem
      )
    );
  }
}
