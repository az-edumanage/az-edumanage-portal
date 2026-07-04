import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Group, GroupScheduleSummary } from '../models/tenant-groups.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupsDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadGroups(): Observable<Group[]> {
    return this.http
      .get<Group[]>(this.groupsUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load groups')));
  }

  loadScheduleSummary(): Observable<GroupScheduleSummary> {
    return this.http
      .get<GroupScheduleSummary>(`${this.groupsUrl}/schedule-summary`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group schedule summary')));
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.groupsUrl}/${encodeURIComponent(groupId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to delete group')));
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
