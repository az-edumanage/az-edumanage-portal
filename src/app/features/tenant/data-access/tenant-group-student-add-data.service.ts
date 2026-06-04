import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TenantGroupEligibleStudentsResponse,
  TenantGroupStudent,
  TenantGroupStudentEnrollmentPayload,
  TenantGroupStudentEnrollmentResult,
} from '../models/tenant-group-student-add.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupStudentAddDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadEligibleStudents(groupId: string | null): Observable<TenantGroupStudent[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http
      .get<TenantGroupEligibleStudentsResponse>(`${this.groupUrl(selectedGroupId)}/eligible-students`)
      .pipe(
        map((response) => response.students ?? []),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load eligible students')),
      );
  }

  searchStudents(query: string, students: TenantGroupStudent[]): TenantGroupStudent[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [...students];
    }

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(normalized) ||
        student.email.toLowerCase().includes(normalized) ||
        student.id.includes(normalized),
    );
  }

  enrollStudentsToGroup(
    groupId: string | null,
    payload: TenantGroupStudentEnrollmentPayload,
  ): Observable<TenantGroupStudentEnrollmentResult> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http
      .post<TenantGroupStudentEnrollmentResult>(`${this.groupUrl(selectedGroupId)}/enrollments`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to enroll students')));
  }

  private groupUrl(groupId: string): string {
    return `${this.groupsUrl}/${encodeURIComponent(groupId)}`;
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? fallback;
    return throwError(() => new Error(message));
  }

  private extractApiMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error && typeof error === 'object') {
      const candidate = error as { message?: unknown; details?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }
    }
    return null;
  }
}
