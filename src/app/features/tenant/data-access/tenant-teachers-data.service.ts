import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Teacher, TeacherCapacity, TeacherStatus, TeacherStatusSummary } from '../models/tenant-teachers.models';

@Injectable({ providedIn: 'root' })
export class TenantTeachersDataService {
  private readonly http = inject(HttpClient);
  private readonly teachersUrl = `${environment.apiBaseUrl}/tenant/teachers`;

  listTeachers(): Observable<Teacher[]> {
    return this.http
      .get<Teacher[]>(this.teachersUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teachers')));
  }

  statusSummary(): Observable<TeacherStatusSummary> {
    return this.http
      .get<TeacherStatusSummary>(`${this.teachersUrl}/status-summary`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher status summary')));
  }

  capacity(): Observable<TeacherCapacity> {
    return this.http
      .get<TeacherCapacity>(`${this.teachersUrl}/capacity`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher capacity')));
  }

  getTeacher(id: string): Observable<Teacher> {
    return this.http
      .get<Teacher>(`${this.teachersUrl}/${id}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher')));
  }

  updateStatus(teacher: Teacher, status: TeacherStatus): Observable<Teacher> {
    return this.http
      .put<Teacher>(`${this.teachersUrl}/${teacher.id}`, {
        ...teacher,
        fullName: teacher.fullName || teacher.name,
        password: '',
        status,
      })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update teacher')));
  }

  changeTeacherPassword(teacherId: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.teachersUrl}/${teacherId}/password`, { newPassword })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to change password')));
  }

  deleteTeacher(teacherId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.teachersUrl}/${encodeURIComponent(teacherId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to delete teacher')));
  }

  exitTeacherGroup(teacherId: string, groupId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${this.teachersUrl}/${encodeURIComponent(teacherId)}/groups/${encodeURIComponent(groupId)}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to exit group')));
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
      if (Array.isArray(candidate.details) && candidate.details.length > 0) {
        return candidate.details.filter((item): item is string => typeof item === 'string').join(', ');
      }
    }
    return null;
  }
}
