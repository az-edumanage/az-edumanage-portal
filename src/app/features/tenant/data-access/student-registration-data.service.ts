import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, catchError, firstValueFrom, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PendingStudentRegistration,
  PublicStudentRegistrationForm,
  PublicStudentRegistrationPayload,
  StudentRegistrationLink,
  StudentRegistrationSummary,
} from '../models/student-registration.models';

@Injectable({ providedIn: 'root' })
export class StudentRegistrationDataService {
  private readonly http = inject(HttpClient);
  private readonly tenantUrl = `${environment.apiBaseUrl}/tenant/student-registrations`;
  private readonly publicUrl = `${environment.apiBaseUrl}/public/student-registration`;
  private pollingSubscription: Subscription | null = null;

  readonly pendingCount = signal(0);

  startCountPolling(): void {
    if (this.pollingSubscription) return;
    this.pollingSubscription = timer(0, 30_000).pipe(
      switchMap(() => this.http.get<StudentRegistrationSummary>(`${this.tenantUrl}/summary`).pipe(
        catchError(() => of({ pendingCount: 0 })),
      )),
    ).subscribe((summary) => this.pendingCount.set(summary.pendingCount ?? 0));
  }

  async refreshCount(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.http.get<StudentRegistrationSummary>(`${this.tenantUrl}/summary`));
      this.pendingCount.set(summary.pendingCount ?? 0);
    } catch {
      this.pendingCount.set(0);
    }
  }

  listPending(): Observable<PendingStudentRegistration[]> {
    return this.http.get<PendingStudentRegistration[]>(`${this.tenantUrl}/pending`);
  }

  listLinks(): Observable<StudentRegistrationLink[]> {
    return this.http.get<StudentRegistrationLink[]>(`${this.tenantUrl}/links`);
  }

  createLink(expiresAt: string): Observable<StudentRegistrationLink> {
    return this.http.post<StudentRegistrationLink>(`${this.tenantUrl}/links`, { expiresAt });
  }

  revokeLink(id: string): Observable<StudentRegistrationLink> {
    return this.http.delete<StudentRegistrationLink>(`${this.tenantUrl}/links/${id}`);
  }

  approve(id: string): Observable<unknown> {
    return this.http.post(`${this.tenantUrl}/requests/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<PendingStudentRegistration> {
    return this.http.post<PendingStudentRegistration>(`${this.tenantUrl}/requests/${id}/reject`, { reason });
  }

  loadPublicForm(token: string): Observable<PublicStudentRegistrationForm> {
    return this.http.get<PublicStudentRegistrationForm>(`${this.publicUrl}/${encodeURIComponent(token)}`);
  }

  submitPublicForm(token: string, payload: PublicStudentRegistrationPayload): Observable<{ requestId: string; status: string; message: string }> {
    return this.http.post<{ requestId: string; status: string; message: string }>(
      `${this.publicUrl}/${encodeURIComponent(token)}`,
      payload,
    );
  }

  errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail ?? error.error?.message ?? error.error?.error;
      if (typeof detail === 'string' && detail.trim()) return detail;
      if (error.status === 410) return 'This registration link has expired or was revoked.';
    }
    return fallback;
  }
}
