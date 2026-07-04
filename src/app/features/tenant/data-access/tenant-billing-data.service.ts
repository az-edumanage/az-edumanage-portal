import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TenantStudentInvoice,
  TenantStudentInvoiceListResponse,
  TenantStudentInvoiceQuery,
} from '../models/tenant-billing.models';

@Injectable({ providedIn: 'root' })
export class TenantBillingDataService {
  private readonly http = inject(HttpClient);
  private readonly invoicesUrl = `${environment.apiBaseUrl}/tenant/billing/invoices`;

  listTenantStudentInvoices(query: TenantStudentInvoiceQuery = {}): Observable<TenantStudentInvoiceListResponse> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 100));

    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.category && query.category !== 'all') {
      params = params.set('category', query.category);
    }
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.studentId?.trim()) {
      params = params.set('studentId', query.studentId.trim());
    }

    return this.http
      .get<TenantStudentInvoiceListResponse>(this.invoicesUrl, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load invoices')));
  }

  markTenantStudentInvoicePaid(invoiceId: string): Observable<TenantStudentInvoice> {
    return this.http
      .patch<TenantStudentInvoice>(`${this.invoicesUrl}/${encodeURIComponent(invoiceId)}/paid`, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to mark invoice paid')));
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
