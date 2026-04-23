import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantGradeCreateForm } from '../models/tenant-grade-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  createGrade(payload: TenantGradeCreateForm): Observable<void> {
    return this.tenantApi
      .createGrade(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
