import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  TenantReportPreview,
  TenantReportPreviewRequest,
  TenantReportSaveRequest,
  TenantReportTemplate,
  TenantSavedReport,
} from '../models/tenant-reports.models';

@Injectable({ providedIn: 'root' })
export class TenantReportsDataService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiBaseUrl}/tenant/reports`;

  loadTemplates(): Observable<TenantReportTemplate[]> {
    return this.http
      .get<TenantReportTemplate[]>(`${this.reportsUrl}/templates`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load report templates')));
  }

  loadSavedReports(): Observable<TenantSavedReport[]> {
    return this.http
      .get<TenantSavedReport[]>(`${this.reportsUrl}/saved`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load saved reports')));
  }

  previewReport(payload: TenantReportPreviewRequest): Observable<TenantReportPreview> {
    return this.http
      .post<TenantReportPreview>(`${this.reportsUrl}/preview`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to preview report')));
  }

  exportPreviewPdf(payload: TenantReportPreviewRequest): Observable<Blob> {
    return this.http
      .post(`${this.reportsUrl}/export/pdf`, payload, { responseType: 'blob' })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to export report PDF')));
  }

  saveReport(payload: TenantReportSaveRequest): Observable<TenantSavedReport> {
    return this.http
      .post<TenantSavedReport>(this.reportsUrl, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to save report')));
  }

  duplicateReport(reportId: string): Observable<TenantSavedReport> {
    return this.http
      .post<TenantSavedReport>(`${this.reportsUrl}/${encodeURIComponent(reportId)}/duplicate`, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to duplicate report')));
  }

  deleteReport(reportId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.reportsUrl}/${encodeURIComponent(reportId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to delete report')));
  }

  toggleFavorite(reportId: string): Observable<TenantSavedReport> {
    return this.http
      .patch<TenantSavedReport>(`${this.reportsUrl}/${encodeURIComponent(reportId)}/favorite`, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update favorite')));
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
