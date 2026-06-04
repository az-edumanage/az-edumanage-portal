import { Injectable, computed, inject } from '@angular/core';
import { OwnerPlansDataService } from '../data-access/owner-plans-data.service';
import { Plan } from '../models/owner-plans.models';
import { OwnerPlansListStore } from './owner-plans-list.store';
import { SYSTEM_FREE_TRIAL_PLAN_NAME } from '../constants/system-plans.constants';

@Injectable({ providedIn: 'root' })
export class OwnerPlansListFacade {
  private readonly store = inject(OwnerPlansListStore);
  private readonly data = inject(OwnerPlansDataService);

  readonly plans = this.store.plans;
  readonly systemTrialPlan = computed(() => this.plans().find((plan) => plan.name === SYSTEM_FREE_TRIAL_PLAN_NAME) ?? null);
  readonly regularPlans = computed(() => this.plans().filter((plan) => plan.name !== SYSTEM_FREE_TRIAL_PLAN_NAME));

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

  async toggleWebsiteAvailability(plan: Plan): Promise<void> {
    const nextVisibility: 'Public' | 'Private' = plan.visibility === 'Public' ? 'Private' : 'Public';
    await this.data.setPlanVisibility(plan.id, nextVisibility);
  }

  async toggleRecommended(plan: Plan): Promise<void> {
    await this.data.setPlanRecommended(plan.id, !plan.isRecommended);
  }

  async toggleShowAnnualPrice(plan: Plan): Promise<void> {
    await this.data.setPlanShowAnnualPrice(plan.id, !plan.showAnnualPrice);
  }
}
