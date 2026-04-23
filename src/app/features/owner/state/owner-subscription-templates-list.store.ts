import { Injectable, inject } from '@angular/core';
import { OwnerSubscriptionTemplatesDataService } from '../data-access/owner-subscription-templates-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionTemplatesListStore {
  private readonly data = inject(OwnerSubscriptionTemplatesDataService);

  readonly templates = this.data.templates;
}
