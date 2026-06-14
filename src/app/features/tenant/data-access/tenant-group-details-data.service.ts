import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GroupDetails,
  GroupLesson,
  GroupLessonContent,
  TenantGroupDetailsResponse,
  TenantGroupLessonContentResponse,
  TenantGroupLessonResponse,
} from '../models/tenant-group-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadGroupById(id: string | null): Observable<GroupDetails> {
    const groupId = id?.trim();
    if (!groupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http.get<TenantGroupDetailsResponse>(this.groupDetailsUrl(groupId)).pipe(
      map((response) => this.toGroupDetails(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group details')),
    );
  }

  groupDetailsUrl(id: string): string {
    return `${this.groupsUrl}/${encodeURIComponent(id)}`;
  }

  removeStudentFromGroup(groupId: string | null, studentId: string): Observable<void> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http
      .delete<void>(
        `${this.groupDetailsUrl(selectedGroupId)}/enrollments/${encodeURIComponent(studentId)}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to exit group')));
  }

  loadGroupLessons(groupId: string | null, options: { sync?: boolean; sessionId?: string | null } = {}): Observable<GroupLesson[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    let params = new HttpParams();
    if (options.sync === true) {
      params = params.set('sync', 'true');
    }
    if (options.sessionId?.trim()) {
      params = params.set('sessionId', options.sessionId.trim());
    }
    return this.http.get<TenantGroupLessonResponse[]>(`${this.groupDetailsUrl(selectedGroupId)}/lessons`, { params }).pipe(
      map((response) => response.map((lesson) => this.toGroupLesson(lesson))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load lessons')),
    );
  }

  addGroupLesson(groupId: string | null, curriculumNodeId: string, options: { sessionId?: string | null } = {}): Observable<GroupLesson> {
    const selectedGroupId = groupId?.trim();
    const selectedNodeId = curriculumNodeId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedNodeId) {
      return throwError(() => new Error('Curriculum lesson is required'));
    }
    return this.http
      .post<TenantGroupLessonResponse>(`${this.groupDetailsUrl(selectedGroupId)}/lessons`, {
        curriculumNodeId: selectedNodeId,
        sessionId: options.sessionId?.trim() || null,
      })
      .pipe(
        map((response) => this.toGroupLesson(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to add lesson')),
      );
  }

  deleteGroupLesson(groupId: string | null, lessonId: string | null): Observable<void> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http
      .delete<void>(`${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to remove lesson')));
  }

  updateGroupLessonCompletion(groupId: string | null, lessonId: string | null, completed: boolean): Observable<GroupLesson> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http
      .patch<TenantGroupLessonResponse>(
        `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/completion`,
        { completed },
      )
      .pipe(
        map((response) => this.toGroupLesson(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update lesson completion')),
      );
  }

  loadGroupLessonContent(groupId: string | null, lessonId: string | null): Observable<GroupLessonContent[]> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http.get<TenantGroupLessonContentResponse[]>(
      `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/content`,
    ).pipe(
      map((response) => response.map((content) => this.toGroupLessonContent(content))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load lesson content')),
    );
  }

  addGroupLessonContent(
    groupId: string | null,
    lessonId: string | null,
    payload: { curriculumNodeId: string; folderId: string; contentType: 'FILE' | 'NOTE' | 'LINK'; contentId: string },
  ): Observable<GroupLessonContent> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http.post<TenantGroupLessonContentResponse>(
      `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/content`,
      payload,
    ).pipe(
      map((response) => this.toGroupLessonContent(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to insert content')),
    );
  }

  private toGroupDetails(response: TenantGroupDetailsResponse): GroupDetails {
    return {
      id: response.id,
      name: response.name,
      subjectId: response.subjectId ?? null,
      educationCategory: response.educationCategory ?? null,
      stageName: response.stageName ?? null,
      gradeName: response.gradeName ?? null,
      subject: response.subject,
      teacher: response.teacher,
      room: response.room,
      schedule: response.schedule,
      capacity: response.capacity ?? 0,
      enrolled: response.enrolled,
      fees: response.pricePerStudent,
      status: response.status,
      pricePerStudent: response.pricePerStudent,
      avgAttendanceRate: response.avgAttendanceRate,
      absenceRate: response.absenceRate,
      attendanceAvailable: response.attendanceAvailable,
      monthlyRevenue: response.monthlyRevenue,
      currency: response.currency,
      startAt: response.startAt ?? null,
      duration: response.duration ?? null,
      daySchedules: response.daySchedules ?? {},
      scheduleDays: response.scheduleDays ?? [],
      calendarEvents: response.calendarEvents ?? [],
      students: (response.students ?? []).map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        barcodeNumber: student.barcodeNumber ?? student.barcode_number ?? null,
        attendanceRate: student.attendanceRate ?? 0,
        lastAttendance: student.lastAttendance,
        attendanceTime: student.attendanceTime ?? null,
        attendanceState: student.attendanceState ?? null,
        attendanceSource: student.attendanceSource ?? null,
      })),
    };
  }

  private toGroupLesson(response: TenantGroupLessonResponse): GroupLesson {
    return {
      id: response.id,
      curriculumNodeId: response.curriculumNodeId,
      title: response.title,
      path: response.path,
      description: response.description ?? null,
      completed: response.completed ?? false,
    };
  }

  private toGroupLessonContent(response: TenantGroupLessonContentResponse): GroupLessonContent {
    return {
      id: response.id,
      curriculumNodeId: response.curriculumNodeId,
      curriculumNodeLabel: response.curriculumNodeLabel,
      folderId: response.folderId,
      folderName: response.folderName,
      contentType: response.contentType,
      contentId: response.contentId,
      title: response.title,
      url: this.mediaUrlToAbsolute(response.url) ?? response.url ?? null,
      fileContentType: response.fileContentType ?? null,
      sizeBytes: response.sizeBytes ?? null,
    };
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

  private mediaUrlToAbsolute(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
