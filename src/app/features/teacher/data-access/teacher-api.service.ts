import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError as rxCatchError, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TenantGroupDetailsDataService } from '../../tenant/data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails } from '../../tenant/models/tenant-group-details.models';
import { TeacherAssignedGroup, TeacherExamSetup, TeacherScheduleSession, TeacherSummary } from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly http = inject(HttpClient);
  private readonly groupDetailsApi = inject(TenantGroupDetailsDataService);
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

  schedule(): Observable<TeacherScheduleSession[]> {
    return this.loadAssignedGroups().pipe(
      switchMap((groups) => {
        if (groups.length === 0) {
          return of([]);
        }
        return forkJoin(groups.map((group) => this.groupDetailsApi.loadGroupById(group.id, { scope: 'teacher' }).pipe(
          rxCatchError(() => of(null)),
          map((details) => ({ group, details })),
        )));
      }),
      map((rows) => rows.flatMap(({ group, details }) => this.groupScheduleSessions(group, details))),
      map((sessions) => sessions.sort((a, b) => this.dayIndex(a.day) - this.dayIndex(b.day) || a.startTime.localeCompare(b.startTime))),
    );
  }

  loadExamSetup(): Observable<TeacherExamSetup[]> {
    return this.http
      .get<TeacherExamSetup[]>(this.teacherExamSetupUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher exam setup')));
  }

  private groupScheduleSessions(group: TeacherAssignedGroup, details: GroupDetails | null): TeacherScheduleSession[] {
    const detailSchedules = Object.keys(details?.daySchedules ?? {}).length > 0 ? details?.daySchedules : null;
    const schedules = Object.entries(detailSchedules ?? group.daySchedules ?? {}).filter(([, schedule]) => schedule?.startTime);
    if (schedules.length > 0) {
      return schedules.map(([day, schedule]) => ({
        id: `${group.id}:${day}:${schedule.startTime}`,
        groupId: group.id,
        groupName: group.name,
        subjectName: group.subject,
        roomId: schedule.roomId ?? null,
        roomName: schedule.room || group.room || '',
        day,
        startTime: schedule.startTime ?? '',
        duration: this.durationMinutes(schedule.startTime, schedule.endTime) ?? group.duration ?? null,
        studentsCount: group.studentsCount,
      }));
    }

    const eventSessions = this.weeklySessionsFromCalendarEvents(group, details?.calendarEvents ?? []);
    if (eventSessions.length > 0) {
      return eventSessions;
    }

    const startTime = group.startAt?.trim();
    if (!startTime) {
      return [];
    }
    return this.scheduleDays(group.schedule).map((day) => ({
      id: `${group.id}:${day}:${startTime}`,
      groupId: group.id,
      groupName: group.name,
      subjectName: group.subject,
      roomId: null,
      roomName: group.room || '',
      day,
      startTime,
      duration: group.duration ?? null,
      studentsCount: group.studentsCount,
    }));
  }

  private weeklySessionsFromCalendarEvents(
    group: TeacherAssignedGroup,
    events: GroupCalendarEvent[],
  ): TeacherScheduleSession[] {
    const unique = new Map<string, GroupCalendarEvent>();
    for (const event of events) {
      const key = `${event.day}:${event.startTime}:${event.endTime}:${event.room ?? ''}`;
      if (!unique.has(key)) {
        unique.set(key, event);
      }
    }
    return [...unique.values()].map((event) => ({
      id: `${group.id}:${event.day}:${event.startTime}`,
      groupId: group.id,
      groupName: group.name,
      subjectName: group.subject,
      roomId: null,
      roomName: event.room || group.room || '',
      day: event.day,
      startTime: event.startTime,
      duration: this.durationMinutes(event.startTime, event.endTime) ?? group.duration ?? null,
      studentsCount: group.studentsCount,
    }));
  }

  private scheduleDays(schedule: string | null | undefined): string[] {
    const value = schedule ?? '';
    const days = this.weekDays.filter((day) => new RegExp(`\\b${day}\\b|\\b${day.slice(0, 3)}\\b`, 'i').test(value));
    return days.length > 0 ? days : ['Not set'];
  }

  private durationMinutes(startTime?: string | null, endTime?: string | null): number | null {
    const start = this.toMinutes(startTime);
    const end = this.toMinutes(endTime);
    if (start === null || end === null || end <= start) {
      return null;
    }
    return end - start;
  }

  private toMinutes(time?: string | null): number | null {
    if (!time) {
      return null;
    }
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    return Number.isNaN(hour) || Number.isNaN(minute) ? null : hour * 60 + minute;
  }

  private dayIndex(day: string): number {
    const index = this.weekDays.indexOf(day);
    return index === -1 ? this.weekDays.length : index;
  }

  private readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
