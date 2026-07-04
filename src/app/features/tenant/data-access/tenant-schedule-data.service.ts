import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendScheduleSession, ScheduleSession } from '../models/tenant-schedule.models';

@Injectable({ providedIn: 'root' })
export class TenantScheduleDataService {
  private readonly http = inject(HttpClient);
  private readonly scheduleUrl = `${environment.apiBaseUrl}/tenant/groups/schedule`;
  private readonly colors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-purple-500 text-white',
    'bg-sky-500 text-white',
  ];

  readonly sessions = signal<ScheduleSession[]>([]);

  loadSessions(date?: string | null): Observable<ScheduleSession[]> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<BackendScheduleSession[]>(this.scheduleUrl, { params }).pipe(
      map((sessions) => sessions.map((session, index) => this.toScheduleSession(session, index))),
      tap((sessions) => this.sessions.set(sessions)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private toScheduleSession(session: BackendScheduleSession, index: number): ScheduleSession {
    return {
      id: session.id,
      groupId: session.groupId,
      groupName: session.groupName,
      subjectName: session.subjectName ?? '',
      teacherName: session.teacherName,
      roomId: session.roomId ?? null,
      roomName: session.roomName,
      day: session.day,
      startTime: session.startTime,
      duration: session.duration,
      studentsCount: session.studentsCount ?? 0,
      color: this.colors[index % this.colors.length],
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? 'Unable to load schedule';
    return throwError(() => new Error(message));
  }

  private extractApiMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error && typeof error === 'object') {
      const candidate = error as { message?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }
    }
    return null;
  }
}
