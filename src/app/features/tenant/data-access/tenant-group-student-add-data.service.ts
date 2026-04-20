import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TenantApiService } from './tenant-api.service';
import { TenantGroupStudent } from '../models/tenant-group-student-add.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupStudentAddDataService {
  private readonly tenantApi = inject(TenantApiService);

  readonly allStudents: TenantGroupStudent[] = [
    { id: '101', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
    { id: '102', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
    { id: '103', name: 'Omar Hassan', email: 'omar@example.com', grade: 'Grade 11' },
    { id: '104', name: 'Laila Mahmoud', email: 'laila@example.com', grade: 'Grade 12' },
    { id: '105', name: 'Youssef Ibrahim', email: 'youssef@example.com', grade: 'Grade 10' },
  ];

  searchStudents(query: string): TenantGroupStudent[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [...this.allStudents];
    }

    return this.allStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(normalized) ||
        student.email.toLowerCase().includes(normalized) ||
        student.id.includes(normalized),
    );
  }

  enrollStudentToGroup(payload: Record<string, unknown>): Observable<void> {
    return this.tenantApi.enrollStudentToGroup(payload).pipe(map(() => void 0));
  }
}
