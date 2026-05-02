import { Injectable, inject } from '@angular/core';
import { OwnerPlansDataService } from '../data-access/owner-plans-data.service';
import { Plan } from '../models/owner-plans.models';
import { OwnerPlansListStore } from './owner-plans-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerPlansListFacade {
  private readonly store = inject(OwnerPlansListStore);
  private readonly data = inject(OwnerPlansDataService);

  readonly plans = this.store.plans;

  async refreshPlans(): Promise<void> {
    await this.data.refreshPlans();
  }

  calculateSavings(plan: Plan): number {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  }

  async togglePlanStatus(plan: Plan): Promise<void> {
    const nextStatus: 'Active' | 'Archived' = plan.status === 'Active' ? 'Archived' : 'Active';
    await this.data.setPlanStatus(plan.id, nextStatus);
  }
}
