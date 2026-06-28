import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TeacherAssignedGroup, TeacherExamSetup, TeacherSummary } from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly http = inject(HttpClient);
  private readonly teacherGroupsUrl = `${environment.apiBaseUrl}/teacher/groups`;
  private readonly teacherExamSetupUrl = `${environment.apiBaseUrl}/teacher/exams/setup`;

  getSummary(): Observable<TeacherSummary> {
    return of({
      sessionsToday: 0,
      groups: 0,
      attendanceRate: 0,
    });
  }

  loadAssignedGroups(): Observable<TeacherAssignedGroup[]> {
    return this.http
      .get<TeacherAssignedGroup[]>(this.teacherGroupsUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load assigned groups')));
  }

  loadExamSetup(): Observable<TeacherExamSetup[]> {
    return this.http
      .get<TeacherExamSetup[]>(this.teacherExamSetupUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher exam setup')));
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
      if (typeof candidate.details === 'string' && candidate.details.trim()) {
        return candidate.details;
      }
    }
    return null;
  }
}
