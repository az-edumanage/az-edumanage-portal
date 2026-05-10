import { Injectable, computed, inject, signal } from '@angular/core';
import { OwnerPlanDetailsDataService } from '../data-access/owner-plan-details-data.service';
import { PlanSubscription } from '../models/owner-plan-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlanDetailsStore {
  private readonly data = inject(OwnerPlanDetailsDataService);

  readonly planId = signal<string | null>(null);
  readonly planName = signal<string>('Plan');

  readonly subscriptions = signal(this.data.subscriptions);
  readonly auditLogs = signal(this.data.auditLogs);
  readonly offers = signal(this.data.offers);

  readonly lastSubscription = computed<PlanSubscription | null>(() => this.subscriptions()[0] ?? null);

  setPlanId(id: string | null): void {
    this.planId.set(id);
    this.planName.set(this.data.getPlanName(id));
  }
}
