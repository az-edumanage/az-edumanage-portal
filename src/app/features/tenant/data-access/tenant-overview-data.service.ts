import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TenantOverviewRange, TenantOverviewView } from '../models/tenant-overview.models';

@Injectable({ providedIn: 'root' })
export class TenantOverviewDataService {
  private readonly http = inject(HttpClient);
  private readonly overviewUrl = `${environment.apiBaseUrl}/tenant/overview`;

  loadOverview(range: TenantOverviewRange = 'today'): Observable<TenantOverviewView> {
    const params = new HttpParams().set('range', range);
    return this.http
      .get<TenantOverviewView>(this.overviewUrl, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? 'Unable to load overview data';
    return throwError(() => new Error(message));
  }

  private extractApiMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error.trim();
    }
    if (error && typeof error === 'object') {
      const candidate = error as { message?: unknown; details?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message.trim();
      }
      if (typeof candidate.details === 'string' && candidate.details.trim()) {
        return candidate.details.trim();
      }
    }
    return null;
  }
}
