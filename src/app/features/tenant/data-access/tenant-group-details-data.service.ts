import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GroupDetails, TenantGroupDetailsResponse } from '../models/tenant-group-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadGroupById(id: string | null): Observable<GroupDetails> {
    const groupId = id?.trim();
    if (!groupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http.get<TenantGroupDetailsResponse>(this.groupDetailsUrl(groupId)).pipe(
      map((response) => this.toGroupDetails(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group details')),
    );
  }

  groupDetailsUrl(id: string): string {
    return `${this.groupsUrl}/${encodeURIComponent(id)}`;
  }

  removeStudentFromGroup(groupId: string | null, studentId: string): Observable<void> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http
      .delete<void>(
        `${this.groupDetailsUrl(selectedGroupId)}/enrollments/${encodeURIComponent(studentId)}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to exit group')));
  }

  private toGroupDetails(response: TenantGroupDetailsResponse): GroupDetails {
    return {
      id: response.id,
      name: response.name,
      subject: response.subject,
      teacher: response.teacher,
      room: response.room,
      schedule: response.schedule,
      capacity: response.capacity ?? 0,
      enrolled: response.enrolled,
      fees: response.pricePerStudent,
      status: response.status,
      pricePerStudent: response.pricePerStudent,
      avgAttendanceRate: response.avgAttendanceRate,
      absenceRate: response.absenceRate,
      attendanceAvailable: response.attendanceAvailable,
      monthlyRevenue: response.monthlyRevenue,
      currency: response.currency,
      students: (response.students ?? []).map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        barcodeNumber: student.barcodeNumber ?? student.barcode_number ?? null,
        attendanceRate: student.attendanceRate ?? 0,
        lastAttendance: student.lastAttendance,
      })),
    };
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
