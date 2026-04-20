import { Injectable, inject } from '@angular/core';
import { OwnerPlansDataService } from '../data-access/owner-plans-data.service';

@Injectable({ providedIn: 'root' })
export class OwnerPlansListStore {
  private readonly data = inject(OwnerPlansDataService);

  readonly plans = this.data.plans;
}
