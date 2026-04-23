import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantStudentCreatePayload } from '../models/tenant-student-create.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  getDefaultFormValue(): TenantStudentCreatePayload {
    return {
      fullName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: 'Male',
      parentName: '',
      parentPhone: '',
      address: '',
      grade: 'Grade 10',
      enrollmentType: 'Full-time',
      isActive: true,
      notifyParent: true,
      notifySMS: false,
    };
  }

  enrollStudent(payload: TenantStudentCreatePayload): Observable<void> {
    return this.tenantApi
      .enrollStudent(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
