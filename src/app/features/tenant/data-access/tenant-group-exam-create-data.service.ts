import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantGroupExamCreatePayload } from '../models/tenant-group-exam-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  createGroupExam(payload: TenantGroupExamCreatePayload): Observable<void> {
    return this.tenantApi
      .createGroupExam(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
