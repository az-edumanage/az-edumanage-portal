import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantTeacherCreatePayload, TenantTeacherEditSeed } from '../models/tenant-teacher-create.models';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateDataService {
  private readonly tenantApi = inject(TenantApiService);

  getDefaultFormValue(): TenantTeacherCreatePayload {
    return {
      fullName: '',
      email: '',
      phone: '',
      subject: 'Physics',
      qualification: '',
      password: 'Teacher123!',
      forcePasswordChange: true,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      canManageAttendance: true,
      canManageExams: true,
      canMessageStudents: true,
      sendWelcomeEmail: true,
    };
  }

  getTeacherForEdit(teacherId: string): TenantTeacherEditSeed {
    void teacherId;

    return {
      fullName: 'Dr. Ahmed Zewail',
      email: 'zewail@center.edu',
      subject: 'Physics',
      qualification: 'PhD in Physics',
    };
  }

  createOrUpdateTeacher(payload: TenantTeacherCreatePayload): Observable<void> {
    return this.tenantApi
      .createOrUpdateTeacher(payload as unknown as Record<string, unknown>)
      .pipe(map(() => void 0));
  }
}
