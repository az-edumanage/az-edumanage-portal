import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StudentDashboard,
  StudentExamAttempt,
  StudentExamCompletion,
  StudentExamQuestionSubmission,
  StudentExamAttemptStart,
  StudentExam,
  StudentExamEvaluation,
  StudentGroup,
  StudentInvoice,
  StudentPublishedSession,
  StudentPublishedSessionDetails,
  StudentScheduleSession,
} from '../models/student-dashboard.models';

@Injectable({ providedIn: 'root' })
export class StudentDashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/student/dashboard`;
  private readonly parentUrl = `${environment.apiBaseUrl}/parent/dashboard`;
  private readonly tenantGroupsUrl = `${environment.apiBaseUrl}/tenant/groups`;
  private readonly teacherEvaluationsUrl = `${environment.apiBaseUrl}/teacher/exam-evaluations`;

  overview(): Observable<StudentDashboard> {
    return this.http.get<StudentDashboard>(`${this.url}/overview`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load student overview')),
    );
  }

  schedule(): Observable<StudentScheduleSession[]> {
    return this.http.get<StudentScheduleSession[]>(`${this.url}/schedule`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load schedule')),
    );
  }

  groups(): Observable<StudentGroup[]> {
    return this.http.get<StudentGroup[]>(`${this.url}/groups`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load groups')),
    );
  }

  groupSessions(groupId: string): Observable<StudentPublishedSession[]> {
    return this.http.get<StudentPublishedSession[]>(`${this.url}/groups/${groupId}/sessions`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load published sessions')),
    );
  }

  groupSessionDetails(groupId: string, sessionId: string): Observable<StudentPublishedSessionDetails> {
    return this.http.get<StudentPublishedSessionDetails>(
      `${this.url}/groups/${groupId}/sessions/${encodeURIComponent(sessionId)}`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load session files')),
    );
  }

  exams(): Observable<StudentExam[]> {
    return this.http.get<StudentExam[]>(`${this.url}/exams`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exams')),
    );
  }

  homeWork(): Observable<StudentExam[]> {
    return this.http.get<StudentExam[]>(`${this.url}/home-work`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load home work')),
    );
  }

  examEvaluations(): Observable<StudentExamEvaluation[]> {
    return this.http.get<StudentExamEvaluation[]>(`${this.url}/exam-evaluations`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam evaluations')),
    );
  }

  tenantExamEvaluations(): Observable<StudentExamEvaluation[]> {
    return this.http.get<StudentExamEvaluation[]>(`${this.tenantGroupsUrl}/exam-evaluations`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam evaluations')),
    );
  }

  tenantGroupExamEvaluations(groupId: string): Observable<StudentExamEvaluation[]> {
    return this.http.get<StudentExamEvaluation[]>(`${this.tenantGroupsUrl}/${groupId}/exam-evaluations`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam evaluations')),
    );
  }

  teacherExamEvaluations(): Observable<StudentExamEvaluation[]> {
    return this.http.get<StudentExamEvaluation[]>(this.teacherEvaluationsUrl).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam evaluations')),
    );
  }

  parentExamEvaluations(): Observable<StudentExamEvaluation[]> {
    return this.http.get<StudentExamEvaluation[]>(`${this.parentUrl}/exam-evaluations`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam evaluations')),
    );
  }

  startExamAttempt(groupId: string, assignmentId: string): Observable<StudentExamAttemptStart> {
    return this.http.post<StudentExamAttemptStart>(
      `${this.url}/groups/${groupId}/exams/${assignmentId}/attempts`,
      {},
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to start exam')),
    );
  }

  examAttempt(groupId: string, assignmentId: string, attemptId: string): Observable<StudentExamAttempt> {
    return this.http.get<StudentExamAttempt>(
      `${this.url}/groups/${groupId}/exams/${assignmentId}/attempts/${attemptId}`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam')),
    );
  }

  completeExamAttempt(
    groupId: string,
    assignmentId: string,
    attemptId: string,
    answers: StudentExamQuestionSubmission[],
  ): Observable<StudentExamCompletion> {
    return this.http.post<StudentExamCompletion>(
      `${this.url}/groups/${groupId}/exams/${assignmentId}/attempts/${attemptId}/complete`,
      { answers },
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to submit exam')),
    );
  }

  examAttemptReport(groupId: string, assignmentId: string, attemptId: string): Observable<StudentExamCompletion> {
    return this.http.get<StudentExamCompletion>(
      `${this.url}/groups/${groupId}/exams/${assignmentId}/attempts/${attemptId}/report`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam report')),
    );
  }

  tenantExamAttemptReport(groupId: string, assignmentId: string, attemptId: string): Observable<StudentExamCompletion> {
    return this.http.get<StudentExamCompletion>(
      `${this.tenantGroupsUrl}/${groupId}/exams/${assignmentId}/attempts/${attemptId}/report`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam report')),
    );
  }

  teacherExamAttemptReport(groupId: string, assignmentId: string, attemptId: string): Observable<StudentExamCompletion> {
    return this.http.get<StudentExamCompletion>(
      `${this.teacherEvaluationsUrl}/groups/${groupId}/exams/${assignmentId}/attempts/${attemptId}/report`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam report')),
    );
  }

  parentExamAttemptReport(groupId: string, assignmentId: string, attemptId: string): Observable<StudentExamCompletion> {
    return this.http.get<StudentExamCompletion>(
      `${this.parentUrl}/groups/${groupId}/exams/${assignmentId}/attempts/${attemptId}/report`,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam report')),
    );
  }

  invoices(): Observable<StudentInvoice[]> {
    return this.http.get<StudentInvoice[]>(`${this.url}/billing/invoices`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load invoices')),
    );
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    const message = this.extractMessage(error.error) ?? fallback;
    return throwError(() => new Error(message));
  }

  private extractMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      return typeof message === 'string' && message.trim() ? message : null;
    }
    return null;
  }
}
