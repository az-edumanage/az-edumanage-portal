import { Injectable, inject } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerSubscriptionsListStore } from './owner-subscriptions-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionsListFacade {
  private readonly store = inject(OwnerSubscriptionsListStore);
  private readonly dashboardService = inject(DashboardService);

  readonly subscriptions = this.store.subscriptions;
  readonly pendingOrdersCount = this.dashboardService.pendingSubscriptionOrdersCount;
}
