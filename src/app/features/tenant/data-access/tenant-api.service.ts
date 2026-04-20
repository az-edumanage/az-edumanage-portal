import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TenantSummary } from '../models/tenant.models';

@Injectable({ providedIn: 'root' })
export class TenantApiService {
  getSummary(): Observable<TenantSummary> {
    return of({
      students: 0,
      teachers: 0,
      groups: 0,
    });
  }
}
