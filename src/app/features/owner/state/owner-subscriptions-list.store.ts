import { Injectable, inject } from '@angular/core';
import { OwnerSubscriptionsDataService } from '../data-access/owner-subscriptions-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionsListStore {
  private readonly data = inject(OwnerSubscriptionsDataService);

  readonly subscriptions = this.data.subscriptions;
}
