import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OwnerSummary } from '../models/owner.models';

@Injectable({ providedIn: 'root' })
export class OwnerApiService {
  getSummary(): Observable<OwnerSummary> {
    return of({
      tenants: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
    });
  }
}
