import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ParentAttendance, ParentChild, ParentInvoice, ParentOverview } from '../models/parent-dashboard.models';

@Injectable({ providedIn: 'root' })
export class ParentDashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/parent/dashboard`;

  overview(): Observable<ParentOverview> {
    return this.http.get<ParentOverview>(`${this.url}/overview`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load parent overview')),
    );
  }

  children(): Observable<ParentChild[]> {
    return this.http.get<ParentChild[]>(`${this.url}/children`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load childs')),
    );
  }

  attendance(): Observable<ParentAttendance[]> {
    return this.http.get<ParentAttendance[]>(`${this.url}/attendance`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load attendance')),
    );
  }

  invoices(): Observable<ParentInvoice[]> {
    return this.http.get<ParentInvoice[]>(`${this.url}/billing/invoices`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load invoices')),
    );
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    const message = this.extractMessage(error.error) ?? fallback;
    return throwError(() => new Error(message));
  }

  private extractMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      return typeof message === 'string' && message.trim() ? message : null;
    }
    return null;
  }
}
