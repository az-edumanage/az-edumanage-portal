import { Injectable, inject } from '@angular/core';
import { OwnerPlanDetailsStore } from './owner-plan-details.store';

@Injectable({ providedIn: 'root' })
export class OwnerPlanDetailsFacade {
  private readonly store = inject(OwnerPlanDetailsStore);

  readonly planId = this.store.planId;
  readonly planName = this.store.planName;
  readonly subscriptions = this.store.subscriptions;
  readonly auditLogs = this.store.auditLogs;
  readonly offers = this.store.offers;
  readonly lastSubscription = this.store.lastSubscription;

  setPlanId(id: string | null): void {
    this.store.setPlanId(id);
  }
}
